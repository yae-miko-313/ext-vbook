const fs = require('fs');
const path = require('path');
const {
    VALID_TYPES,
    collectPluginRootsRecursively,
    normalizeType,
    readJson,
    relativeFromWorkspace,
    writeJson
} = require('../core/migration-utils');

const RAW_REPO_BASE = 'https://raw.githubusercontent.com/kychitoge/vbook-ext/main';

function getTypeBuckets() {
    return [...VALID_TYPES, '_unknown'];
}

function buildDescriptor(workspaceRoot, pluginRoot) {
    const pluginJsonPath = path.join(pluginRoot, 'plugin.json');
    const plugin = readJson(pluginJsonPath);
    const metadata = plugin && plugin.metadata && typeof plugin.metadata === 'object'
        ? plugin.metadata
        : {};

    return {
        folder: path.basename(pluginRoot),
        name: metadata.name || null,
        author: metadata.author || null,
        description: metadata.description || null,
        source: metadata.source || null,
        version: metadata.version || null,
        type: normalizeType(metadata.type, metadata, plugin.script),
        locale: metadata.locale || null,
        relativePath: relativeFromWorkspace(workspaceRoot, pluginRoot),
        metadata
    };
}

function collectDescriptorsForType(workspaceRoot, typeDir) {
    const roots = [];
    collectPluginRootsRecursively(typeDir, roots);

    const descriptors = [];
    for (const pluginRoot of roots) {
        try {
            descriptors.push(buildDescriptor(workspaceRoot, pluginRoot));
        } catch (error) {
            descriptors.push({
                folder: path.basename(pluginRoot),
                relativePath: relativeFromWorkspace(workspaceRoot, pluginRoot),
                error: `Cannot read plugin.json: ${error.message}`
            });
        }
    }

    descriptors.sort((a, b) => (a.folder || '').localeCompare(b.folder || ''));
    return descriptors;
}

function normalizeCatalogVersion(version) {
    if (typeof version === 'number' && Number.isFinite(version) && version > 0) {
        return Math.floor(version);
    }

    if (typeof version === 'string' && /^\d+$/.test(version.trim())) {
        const parsed = parseInt(version.trim(), 10);
        return parsed > 0 ? parsed : 1;
    }

    return 1;
}

function ensureCatalogType(bucket, typeFromDescriptor) {
    if (typeof typeFromDescriptor === 'string' && typeFromDescriptor.trim()) {
        return typeFromDescriptor.trim();
    }

    if (bucket !== '_unknown') {
        return bucket;
    }

    return 'unknown';
}

function descriptorToQuickLinkEntry(bucket, descriptor) {
    const relativePath = (descriptor.relativePath || '').replace(/\\/g, '/');
    const encodedRelativePath = relativePath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
    const entryName = descriptor.name || descriptor.folder || 'Unnamed Extension';
    const entryAuthor = descriptor.author || 'unknown';

    return {
        name: entryName,
        author: entryAuthor,
        path: `${RAW_REPO_BASE}/${encodedRelativePath}/plugin.zip`,
        version: normalizeCatalogVersion(descriptor.version),
        source: descriptor.source || '',
        icon: `${RAW_REPO_BASE}/${encodedRelativePath}/icon.png`,
        description: descriptor.description || '',
        type: ensureCatalogType(bucket, descriptor.type),
        locale: descriptor.locale || 'vi_VN'
    };
}

function toQuickLinkCatalog(bucket, descriptors) {
    const items = descriptors
        .filter((descriptor) => !descriptor.error)
        .map((descriptor) => descriptorToQuickLinkEntry(bucket, descriptor));

    return {
        metadata: {
            author: 'kychi',
            description: `catalog ${bucket} - synced from extensions/${bucket}`
        },
        data: items
    };
}

function toAllQuickLinkCatalog(buckets, megaCatalog) {
    const allItems = [];

    for (const bucket of buckets) {
        const descriptors = megaCatalog[bucket] || [];
        for (const descriptor of descriptors) {
            if (descriptor.error) continue;
            allItems.push(descriptorToQuickLinkEntry(bucket, descriptor));
        }
    }

    return {
        metadata: {
            author: 'kychi',
            description: 'catalog all - synced from extensions/*'
        },
        data: allItems
    };
}

function runBuildCatalog(workspaceRoot, options = {}) {
    const extensionsRoot = path.join(workspaceRoot, 'extensions');
    const catalogsRoot = path.join(extensionsRoot, 'catalogs');
    const buckets = [...VALID_TYPES];
    const megaCatalog = {};

    for (const bucket of buckets) {
        const typeDir = path.join(extensionsRoot, bucket);
        const descriptors = collectDescriptorsForType(workspaceRoot, typeDir);
        megaCatalog[bucket] = descriptors;
        writeJson(path.join(typeDir, 'plugin.json'), descriptors);
    }

    const unknownTypeDir = path.join(extensionsRoot, '_unknown');
    const unknownDescriptors = collectDescriptorsForType(workspaceRoot, unknownTypeDir);
    if (unknownDescriptors.length > 0) {
        megaCatalog._unknown = unknownDescriptors;
        buckets.push('_unknown');
        writeJson(path.join(unknownTypeDir, 'plugin.json'), unknownDescriptors);
    } else {
        const unknownPluginPath = path.join(unknownTypeDir, 'plugin.json');
        if (fs.existsSync(unknownPluginPath)) {
            fs.unlinkSync(unknownPluginPath);
        }

        const unknownCatalogPath = path.join(catalogsRoot, '_unknown.plugin.json');
        if (fs.existsSync(unknownCatalogPath)) {
            fs.unlinkSync(unknownCatalogPath);
        }
    }

    const megaPath = path.join(extensionsRoot, 'plugin.json');
    writeJson(megaPath, megaCatalog);

    // Optional quick-link catalogs are kept in sync here to avoid stale or malformed files.
    for (const bucket of buckets) {
        const catalogPath = path.join(catalogsRoot, `${bucket}.plugin.json`);
        writeJson(catalogPath, toQuickLinkCatalog(bucket, megaCatalog[bucket]));
    }

    const allCatalogPath = path.join(catalogsRoot, 'all.plugin.json');
    writeJson(allCatalogPath, toAllQuickLinkCatalog(buckets, megaCatalog));

    const summary = {
        total: buckets.reduce((acc, bucket) => acc + megaCatalog[bucket].length, 0),
        byType: Object.fromEntries(buckets.map((bucket) => [bucket, megaCatalog[bucket].length]))
    };

    return {
        generatedAt: new Date().toISOString(),
        reportPath: relativeFromWorkspace(workspaceRoot, megaPath),
        summary,
        catalog: megaCatalog
    };
}

function printBuildCatalogReport(report) {
    console.log('');
    console.log('VBook Build Catalog Report');
    console.log('==========================');
    console.log(`MegaCatalog: ${report.reportPath}`);
    console.log(`Total Entries: ${report.summary.total}`);
    for (const [type, count] of Object.entries(report.summary.byType)) {
        console.log(`- ${type}: ${count}`);
    }
}

module.exports = {
    runBuildCatalog,
    printBuildCatalogReport
};
