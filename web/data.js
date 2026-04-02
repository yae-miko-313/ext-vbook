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

function resolveCatalogEndpoints(catalogUrl) {
    const fallback = {
        rootUrl: './plugin.json',
        sourceUrl: './catalog.json'
    };

    if (!catalogUrl) {
        return fallback;
    }

    try {
        const parsed = new URL(catalogUrl, window.location.href);

        if (/\/catalog\.json$/i.test(parsed.pathname)) {
            const rootUrl = new URL(parsed.toString());
            rootUrl.pathname = rootUrl.pathname.replace(/\/catalog\.json$/i, '/plugin.json');
            return {
                rootUrl: rootUrl.toString(),
                sourceUrl: parsed.toString()
            };
        }

        if (/\/plugin\.json$/i.test(parsed.pathname)) {
            const sourceUrl = new URL(parsed.toString());
            sourceUrl.pathname = sourceUrl.pathname.replace(/\/plugin\.json$/i, '/catalog.json');
            return {
                rootUrl: parsed.toString(),
                sourceUrl: sourceUrl.toString()
            };
        }
    } catch (_error) {
    }

    return fallback;
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
            avatar: source.avatar || '',
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
        const endpoints = resolveCatalogEndpoints(catalogUrl);
        const response = await fetch(endpoints.rootUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.data)) {
            if (Array.isArray(data.sources)) {
                throw new Error('catalog.json là sidecar, cần plugin.json làm root manifest');
            }

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
        window.catalogMeta.loadedCatalogUrl = absoluteUrlFromRelative(endpoints.rootUrl);
        window.catalogMeta.aggregateCopyUrl = window.catalogMeta.loadedCatalogUrl || '';

        resetExtensionCatalog();
        window.catalogExtensions = [];
        window.catalogSources = [];
        window.catalogSourceExpandedState = {};
        hydrateFromRootCatalog(data);

        try {
            const sourceResponse = await fetch(endpoints.sourceUrl);
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
