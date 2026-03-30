const path = require('path');
const {
    VALID_TYPES,
    collectPluginRootsRecursively,
    readJson,
    relativeFromWorkspace,
    writeJson
} = require('./migration-utils');

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
        type: metadata.type || null,
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

function runBuildCatalog(workspaceRoot, options = {}) {
    const extensionsRoot = path.join(workspaceRoot, 'extensions');
    const catalogsRoot = path.join(extensionsRoot, 'catalogs');
    const buckets = getTypeBuckets();
    const megaCatalog = {};

    for (const bucket of buckets) {
        const typeDir = path.join(extensionsRoot, bucket);
        const descriptors = collectDescriptorsForType(workspaceRoot, typeDir);
        megaCatalog[bucket] = descriptors;
        writeJson(path.join(typeDir, 'plugin.json'), descriptors);
    }

    const megaPath = path.join(extensionsRoot, 'plugin.json');
    writeJson(megaPath, megaCatalog);

    // Optional quick-link catalogs are kept in sync here to avoid stale or malformed files.
    for (const bucket of buckets) {
        const catalogPath = path.join(catalogsRoot, `${bucket}.plugin.json`);
        writeJson(catalogPath, { [bucket]: megaCatalog[bucket] });
    }

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
