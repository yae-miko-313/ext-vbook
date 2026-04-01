const fs = require('fs');
const path = require('path');

function safeReadJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
}

function flattenCommunityData(refCatalog) {
    const flat = [];
    const seen = new Set();

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function makeItemKey(item) {
        const pathKey = normalize(item && item.path);
        if (pathKey) {
            return `path:${pathKey}`;
        }

        const nameKey = normalize(item && item.name);
        const authorKey = normalize(item && item.author);
        const sourceKey = normalize(item && item.source);
        const typeKey = normalize(item && item.type);
        return `sig:${nameKey}|${authorKey}|${sourceKey}|${typeKey}`;
    }

    function pushUnique(item) {
        if (!item || typeof item !== 'object') {
            return;
        }

        const key = makeItemKey(item);
        if (seen.has(key)) {
            return;
        }

        seen.add(key);
        flat.push(item);
    }

    if (Array.isArray(refCatalog.data)) {
        refCatalog.data.forEach((item) => {
            pushUnique(item);
        });
    }

    if (Array.isArray(refCatalog.sources)) {
        refCatalog.sources.forEach((source) => {
            const sourceItems = Array.isArray(source && source.content && source.content.data)
                ? source.content.data
                : [];
            sourceItems.forEach((item) => {
                pushUnique(item);
            });
        });
    }

    return flat;
}

function buildWebCatalog(workspaceRoot) {
    const refPath = path.join(workspaceRoot, 'ref', 'plugin.json');
    const sourceCatalog = safeReadJson(refPath);

    if (!sourceCatalog || typeof sourceCatalog !== 'object') {
        throw new Error('ref/plugin.json is missing or invalid');
    }

    const data = flattenCommunityData(sourceCatalog);
    const metadata = {
        author: sourceCatalog.metadata && sourceCatalog.metadata.author ? sourceCatalog.metadata.author : 'kychi',
        description: sourceCatalog.metadata && sourceCatalog.metadata.description
            ? sourceCatalog.metadata.description
            : 'Community aggregate manifest'
    };

    const rootCatalog = {
        metadata,
        data
    };

    const sidecarCatalog = {
        metadata: sourceCatalog.metadata || {},
        summary: sourceCatalog.summary || {},
        referenceListUrl: sourceCatalog.referenceListUrl || '',
        sources: Array.isArray(sourceCatalog.sources) ? sourceCatalog.sources : []
    };

    fs.writeFileSync(path.join(workspaceRoot, 'web', 'plugin.json'), `${JSON.stringify(rootCatalog, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(workspaceRoot, 'web', 'catalog.json'), `${JSON.stringify(sidecarCatalog, null, 2)}\n`, 'utf8');

    return {
        success: true,
        files: [
            { path: 'web/plugin.json', count: data.length },
            { path: 'web/catalog.json', count: sidecarCatalog.sources.length }
        ],
        total: data.length
    };
}

module.exports = {
    buildWebCatalog
};