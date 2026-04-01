// Load community catalog data from web/plugin.json (root-like aggregate) and web/catalog.json (source sidecar).
const extensionCatalog = {
    novel: [],
    comic: [],
    chinese_novel: [],
    translate: [],
    tts: [],
    _unknown: []
};

window.catalogExtensions = [];
window.catalogSources = [];
window.catalogSourceExpandedState = {};
window.catalogMeta = {
    aggregateCopyUrl: '',
    referenceListUrl: '',
    loadedCatalogUrl: ''
};
window.catalogStatus = {
    loadedAt: null,
    updatedAt: null,
    updatedAtSource: ''
};

function resetExtensionCatalog() {
    Object.keys(extensionCatalog).forEach((type) => {
        extensionCatalog[type] = [];
    });
}

function normalizeType(type) {
    if (extensionCatalog[type]) {
        return type;
    }
    return '_unknown';
}

function normalizeExtItem(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const normalized = {
        ...item,
        type: normalizeType(item.type || (item.metadata && item.metadata.type))
    };

    return normalized;
}

function pushNormalizedExtension(item) {
    const normalized = normalizeExtItem(item);
    if (!normalized) {
        return;
    }

    extensionCatalog[normalized.type].push(normalized);
    window.catalogExtensions.push(normalized);
}

function sourceDisplayNameFromUrl(url, fallbackId) {
    if (!url) {
        return fallbackId || 'unknown-source';
    }

    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('raw.githubusercontent.com')) {
            const parts = parsed.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
                return `${parts[0]}/${parts[1]}`;
            }
        }
        if (parsed.hostname.includes('github.com')) {
            const parts = parsed.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
                return `${parts[0]}/${parts[1]}`;
            }
        }
        return `${parsed.hostname}${parsed.pathname}`;
    } catch (_error) {
        return fallbackId || url;
    }
}

function absoluteUrlFromRelative(relativePath) {
    try {
        return new URL(relativePath, window.location.href).toString();
    } catch (_error) {
        return relativePath;
    }
}

function resolveCatalogUrl() {
    const params = new URLSearchParams(window.location.search || '');
    const byQuery = params.get('catalog');
    if (byQuery) {
        return byQuery;
    }
    return './plugin.json';
}

function resolveSourceCatalogUrl(catalogUrl) {
    if (!catalogUrl) {
        return './catalog.json';
    }

    try {
        const parsed = new URL(catalogUrl, window.location.href);
        if (/\/plugin\.json$/i.test(parsed.pathname)) {
            parsed.pathname = parsed.pathname.replace(/\/plugin\.json$/i, '/catalog.json');
            return parsed.toString();
        }
    } catch (_error) {
    }

    return './catalog.json';
}

function hydrateFromRootCatalog(data) {
    const aggregateItems = Array.isArray(data.data) ? data.data : [];
    aggregateItems.forEach((item) => {
        pushNormalizedExtension(item);
    });

    window.catalogMeta.referenceListUrl = data.referenceListUrl || window.catalogMeta.referenceListUrl || '';
}

function hydrateFromSourceCatalog(data) {
    const sources = Array.isArray(data.sources) ? data.sources : [];
    window.catalogSources = sources.map((source) => {
        const rawUrl = source.url || source.fetchedUrl || '';
        const sourceItems = Array.isArray(source.content && source.content.data)
            ? source.content.data
            : [];

        const normalizedItems = sourceItems
            .map(normalizeExtItem)
            .filter(Boolean);

        return {
            id: source.id || '',
            url: rawUrl,
            itemCount: Number(source.itemCount || normalizedItems.length || 0),
            status: source.status || '',
            displayName: sourceDisplayNameFromUrl(rawUrl, source.id || ''),
            extItems: normalizedItems
        };
    });

    window.catalogMeta.referenceListUrl = data.referenceListUrl || window.catalogMeta.referenceListUrl || '';
}

async function loadExtensions() {
    try {
        const catalogUrl = resolveCatalogUrl();
        const response = await fetch(catalogUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.data)) {
            throw new Error('plugin.json sai cấu trúc aggregate: cần có data[]');
        }

        const loadedAtIso = new Date().toISOString();
        const headerLastModified = response.headers.get('Last-Modified');
        const parsedLastModified = headerLastModified ? new Date(headerLastModified) : null;
        const validLastModified = parsedLastModified && !Number.isNaN(parsedLastModified.getTime())
            ? parsedLastModified.toISOString()
            : null;

        window.catalogStatus.loadedAt = loadedAtIso;
        window.catalogStatus.updatedAt = validLastModified || loadedAtIso;
        window.catalogStatus.updatedAtSource = validLastModified ? 'header' : 'loaded';
        window.catalogMeta.loadedCatalogUrl = absoluteUrlFromRelative(catalogUrl);
        window.catalogMeta.aggregateCopyUrl = window.catalogMeta.loadedCatalogUrl || '';

        resetExtensionCatalog();
        window.catalogExtensions = [];
        window.catalogSources = [];
        window.catalogSourceExpandedState = {};
        hydrateFromRootCatalog(data);

        const sourceCatalogUrl = resolveSourceCatalogUrl(catalogUrl);
        try {
            const sourceResponse = await fetch(sourceCatalogUrl);
            if (sourceResponse.ok) {
                const sourceData = await sourceResponse.json();
                hydrateFromSourceCatalog(sourceData);
            }
        } catch (_error) {
            window.catalogSources = [];
        }

        renderDashboard();
    } catch (error) {
        console.error('Error loading extensions:', error);
        document.getElementById('extensions-grid').innerHTML =
            `<div style="grid-column: 1/-1; padding: 20px; color: red;">
                Lỗi: Không thể tải plugin.json đúng cấu trúc root manifest.
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadExtensions);
