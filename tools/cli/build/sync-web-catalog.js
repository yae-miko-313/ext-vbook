const fs = require('fs');
const path = require('path');

function safeReadJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
}

function buildWebSourceList(workspaceRoot) {
    const sourceListPath = path.join(workspaceRoot, 'references', 'remote-sources.json');
    const sourceList = safeReadJson(sourceListPath);

    if (!sourceList || typeof sourceList !== 'object') {
        return null;
    }

    const normalizedSources = Array.isArray(sourceList.sources)
        ? sourceList.sources.map((source) => ({
            id: source && source.id ? String(source.id) : '',
            url: source && source.url ? String(source.url) : '',
            avatar: source && source.avatar ? String(source.avatar) : undefined
        })).filter((source) => source.id && source.url)
        : [];

    return {
        generatedAt: new Date().toISOString(),
        source: 'references/remote-sources.json',
        referenceListUrl: sourceList.referenceListUrl || '',
        sources: normalizedSources
    };
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

    if (Array.isArray(refCatalog.items)) {
        refCatalog.items.forEach((item) => {
            const sourceItems = Array.isArray(item && item.content && item.content.data)
                ? item.content.data
                : [];
            sourceItems.forEach((sourceItem) => {
                pushUnique(sourceItem);
            });
        });
    }

    return flat;
}

function buildWebCatalog(workspaceRoot) {
    const monitorPath = path.join(workspaceRoot, 'ref', 'monitor.json');
    const legacyPath = path.join(workspaceRoot, 'ref', 'plugin.json');
    const sourceCatalog = safeReadJson(monitorPath) || safeReadJson(legacyPath);

    if (!sourceCatalog || typeof sourceCatalog !== 'object') {
        throw new Error('ref/monitor.json or ref/plugin.json is missing or invalid');
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

    const sources = Array.isArray(sourceCatalog.sources)
        ? sourceCatalog.sources
        : (Array.isArray(sourceCatalog.items) ? sourceCatalog.items : []);

    const sidecarCatalog = {
        metadata: sourceCatalog.metadata || {},
        summary: sourceCatalog.summary || {},
        referenceListUrl: sourceCatalog.referenceListUrl || '',
        sources
    };

    const webSourceList = buildWebSourceList(workspaceRoot);

    fs.writeFileSync(path.join(workspaceRoot, 'web', 'plugin.json'), `${JSON.stringify(rootCatalog, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(workspaceRoot, 'web', 'catalog.json'), `${JSON.stringify(sidecarCatalog, null, 2)}\n`, 'utf8');
    if (webSourceList) {
        fs.writeFileSync(path.join(workspaceRoot, 'web', 'remote-sources.json'), `${JSON.stringify(webSourceList, null, 2)}\n`, 'utf8');
    }

    return {
        success: true,
        files: [
            { path: 'web/plugin.json', count: data.length },
            { path: 'web/catalog.json', count: sidecarCatalog.sources.length },
            { path: 'web/remote-sources.json', count: webSourceList ? webSourceList.sources.length : 0 }
        ],
        total: data.length
    };
}

module.exports = {
    buildWebCatalog
};