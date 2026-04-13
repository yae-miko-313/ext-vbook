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
    updatedAtSource: '',
    mode: 'snapshot'
};

const REALTIME_SOURCE_LIST_CANDIDATES = [
    './remote-sources.json',
    '../references/remote-sources.json'
];

const DEFAULT_TIMEOUT_MS = 12000;

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

function normalizeSourceId(id, index) {
    const clean = String(id || '').trim();
    if (clean) {
        return clean;
    }

    return `source-${index + 1}`;
}

function normalizeSourceEntry(entry, index) {
    const id = normalizeSourceId(entry && entry.id, index);
    const url = String(entry && entry.url ? entry.url : '').trim();
    const avatar = String(entry && entry.avatar ? entry.avatar : '').trim();

    return {
        id,
        url,
        avatar
    };
}

function shouldUseRealtimeMode() {
    const params = new URLSearchParams(window.location.search || '');

    if (params.get('catalog')) {
        return false;
    }

    const raw = String(params.get('realtime') || params.get('live') || '1').trim().toLowerCase();
    if (raw === '0' || raw === 'false' || raw === 'off' || raw === 'no') {
        return false;
    }

    return true;
}

function stripJsonComments(text) {
    let result = '';
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (escapeNext) {
            result += char;
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            result += char;
            escapeNext = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            result += char;
            continue;
        }

        if (!inString && char === '/' && nextChar === '/') {
            while (i < text.length && text[i] !== '\n') {
                i += 1;
            }
            if (i < text.length) {
                result += '\n';
            }
            continue;
        }

        result += char;
    }

    return result;
}

function removeTrailingCommas(text) {
    return text.replace(/,(\s*[}\]])/g, '$1');
}

function parseJsonLenient(text) {
    const stripped = stripJsonComments(text);
    const cleaned = removeTrailingCommas(stripped);
    return JSON.parse(cleaned);
}

async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
        });

        return response;
    } finally {
        clearTimeout(timer);
    }
}

function parseLastModifiedToIso(lastModified) {
    if (!lastModified) {
        return null;
    }

    const parsed = new Date(lastModified);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString();
}

async function loadRealtimeSourceList() {
    let lastError = null;

    for (const candidatePath of REALTIME_SOURCE_LIST_CANDIDATES) {
        try {
            const response = await fetchWithTimeout(candidatePath, DEFAULT_TIMEOUT_MS);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const rawText = await response.text();
            const parsed = parseJsonLenient(rawText);
            const sources = Array.isArray(parsed.sources)
                ? parsed.sources.map(normalizeSourceEntry).filter((entry) => entry.id && entry.url)
                : [];

            if (!sources.length) {
                throw new Error('sources[] is empty');
            }

            return {
                sources,
                referenceListUrl: parsed.referenceListUrl || '',
                loadedFrom: absoluteUrlFromRelative(candidatePath)
            };
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Cannot load realtime source list');
}

function parseRemoteSourceContent(text) {
    const parsed = parseJsonLenient(text);
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('invalid JSON content');
    }

    if (!Array.isArray(parsed.data)) {
        throw new Error('missing data[]');
    }

    return parsed;
}

function buildRealtimeShareUrl() {
    const current = new URL(window.location.href);
    current.searchParams.delete('catalog');
    current.searchParams.set('realtime', '1');
    return current.toString();
}

function makeExtUniqueKey(item) {
    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

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

function flattenUniqueExtensionsFromSources(sources) {
    const seen = new Set();
    const flat = [];

    (sources || []).forEach((source) => {
        const items = Array.isArray(source && source.content && source.content.data)
            ? source.content.data
            : [];

        items.forEach((item) => {
            const key = makeExtUniqueKey(item);
            if (seen.has(key)) {
                return;
            }

            seen.add(key);
            flat.push(item);
        });
    });

    return flat;
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
    resetExtensionCatalog();
    window.catalogExtensions = [];
    window.catalogSources = [];
    window.catalogSourceExpandedState = {};

    const loadedAtIso = new Date().toISOString();

    if (shouldUseRealtimeMode()) {
        try {
            const sourceList = await loadRealtimeSourceList();
            const sourceFetchResults = await Promise.all(sourceList.sources.map(async (source) => {
                try {
                    const response = await fetchWithTimeout(source.url, DEFAULT_TIMEOUT_MS);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const text = await response.text();
                    const parsed = parseRemoteSourceContent(text);
                    const itemCount = Array.isArray(parsed.data) ? parsed.data.length : 0;
                    const lastModifiedIso = parseLastModifiedToIso(response.headers.get('Last-Modified'));

                    return {
                        id: source.id,
                        url: source.url,
                        avatar: source.avatar || '',
                        status: 'active',
                        changed: false,
                        itemCount,
                        lastModifiedIso,
                        content: parsed
                    };
                } catch (error) {
                    return {
                        id: source.id,
                        url: source.url,
                        avatar: source.avatar || '',
                        status: 'error',
                        changed: false,
                        itemCount: 0,
                        lastModifiedIso: null,
                        content: { data: [] },
                        error: error.message
                    };
                }
            }));

            const realtimeRoot = {
                metadata: {
                    author: 'kychi',
                    description: 'Community aggregate (realtime mode)'
                },
                referenceListUrl: sourceList.referenceListUrl || '',
                data: flattenUniqueExtensionsFromSources(sourceFetchResults)
            };

            const realtimeSidecar = {
                metadata: realtimeRoot.metadata,
                summary: {
                    total: sourceFetchResults.length,
                    changed: 0,
                    unchanged: sourceFetchResults.filter((item) => item.status !== 'error').length,
                    errors: sourceFetchResults.filter((item) => item.status === 'error').length,
                    mode: 'realtime'
                },
                referenceListUrl: sourceList.referenceListUrl || '',
                sources: sourceFetchResults
            };

            const latestHeaderIso = sourceFetchResults
                .map((item) => item.lastModifiedIso)
                .filter(Boolean)
                .sort()
                .slice(-1)[0] || null;

            window.catalogStatus.loadedAt = loadedAtIso;
            window.catalogStatus.updatedAt = latestHeaderIso || loadedAtIso;
            window.catalogStatus.updatedAtSource = latestHeaderIso ? 'header' : 'loaded';
            window.catalogStatus.mode = 'realtime';
            window.catalogMeta.loadedCatalogUrl = sourceList.loadedFrom;
            window.catalogMeta.aggregateCopyUrl = buildRealtimeShareUrl();

            hydrateFromRootCatalog(realtimeRoot);
            hydrateFromSourceCatalog(realtimeSidecar);
            renderDashboard();
            return;
        } catch (error) {
            console.warn('Realtime mode failed, fallback to snapshot mode:', error);
        }
    }

    try {
        const catalogUrl = resolveCatalogUrl();
        const endpoints = resolveCatalogEndpoints(catalogUrl);
        const response = await fetchWithTimeout(endpoints.rootUrl, DEFAULT_TIMEOUT_MS);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const rawText = await response.text();
        const data = parseJsonLenient(rawText);
        if (!Array.isArray(data.data)) {
            if (Array.isArray(data.sources)) {
                throw new Error('catalog.json là sidecar, cần plugin.json làm root manifest');
            }

            throw new Error('plugin.json sai cấu trúc aggregate: cần có data[]');
        }

        const validLastModified = parseLastModifiedToIso(response.headers.get('Last-Modified'));

        window.catalogStatus.loadedAt = loadedAtIso;
        window.catalogStatus.updatedAt = validLastModified || loadedAtIso;
        window.catalogStatus.updatedAtSource = validLastModified ? 'header' : 'loaded';
        window.catalogStatus.mode = 'snapshot';
        window.catalogMeta.loadedCatalogUrl = absoluteUrlFromRelative(endpoints.rootUrl);
        window.catalogMeta.aggregateCopyUrl = window.catalogMeta.loadedCatalogUrl || '';

        hydrateFromRootCatalog(data);

        try {
            const sourceResponse = await fetchWithTimeout(endpoints.sourceUrl, DEFAULT_TIMEOUT_MS);
            if (sourceResponse.ok) {
                const sourceText = await sourceResponse.text();
                const sourceData = parseJsonLenient(sourceText);
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
