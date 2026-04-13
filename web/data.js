/**
 * VBook Extension Web Catalog Loader
 * 
 * Architecture:
 * - PRIMARY: Realtime mode - fetches fresh extension data from remote sources in real-time
 * - FALLBACK: Snapshot mode - uses static cached JSON files from web/ folder
 * 
 * Realtime flow:
 * 1. Load source list from ./remote-sources.json (synced from references/remote-sources.json)
 * 2. Fetch each remote source's plugin.json in parallel
 * 3. Merge results into catalog, dedup by extension path/signature
 * 
 * Snapshot flow (fallback only):
 * 1. Load from ./plugin.json if realtime fails
 * 2. Used when browser can't reach remote sources or network is offline
 */

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
window.siteHealthByUrl = {};
window.siteHealthMeta = {
    timestamp: '',
    totalChecked: 0,
    stats: {
        ok: 0,
        redirected: 0,
        cloudflare: 0,
        dead: 0,
        uncertain: 0
    }
};
window.catalogMeta = {
    aggregateCopyUrl: '',
    referenceListUrl: '',
    loadedCatalogUrl: ''
};
window.catalogStatus = {
    loadedAt: null,
    updatedAt: null,
    updatedAtSource: '',
    mode: 'realtime' // DEFAULT: Always try realtime first
};

// Candidates for loading realtime source list (tried in order)
const REALTIME_SOURCE_LIST_CANDIDATES = [
    './remote-sources.json',
    '../references/remote-sources.json'
];

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_REFRESH_INTERVAL_MS = 30000;

let isLoadingExtensions = false;
let liveRefreshTimer = null;

function normalizeSiteUrlKey(rawUrl) {
    try {
        const parsed = new URL(String(rawUrl || '').trim());
        const protocol = parsed.protocol.toLowerCase();
        const hostname = parsed.hostname.toLowerCase();
        const port = parsed.port && !((protocol === 'http:' && parsed.port === '80') || (protocol === 'https:' && parsed.port === '443'))
            ? `:${parsed.port}`
            : '';
        const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
        return `${protocol}//${hostname}${port}${pathname}`;
    } catch (_error) {
        return '';
    }
}

window.normalizeSiteUrlKey = normalizeSiteUrlKey;
window.filterByState = function filterByState(items, state) {
    const target = String(state || '').trim().toLowerCase();
    if (!target) {
        return Array.isArray(items) ? items.slice() : [];
    }

    return (Array.isArray(items) ? items : []).filter((item) => String(item && item.state ? item.state : '').toLowerCase() === target);
};

window.filterByConfidence = function filterByConfidence(items, confidence) {
    const target = String(confidence || '').trim().toLowerCase();
    if (!target) {
        return Array.isArray(items) ? items.slice() : [];
    }

    return (Array.isArray(items) ? items : []).filter((item) => String(item && item.confidence ? item.confidence : '').toLowerCase() === target);
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

/**
 * Determine whether to use realtime mode.
 * 
 * REALTIME MODE (default):
 * - Fetches fresh data directly from remote GitHub/GitLab sources
 * - By default: enabled unless explicitly disabled via query params
 * 
 * SNAPSHOT MODE (fallback only):
 * - Uses static web/plugin.json and web/catalog.json if realtime fails
 * - Should ONLY be used when realtime fetch is impossible
 * 
 * Query parameters to control:
 * - ?realtime=1 or ?live=1 (explicit enable, default)
 * - ?realtime=0 or ?catalog=1 (force snapshot mode)
 * 
 * @returns {boolean} true = fetch realtime, false = use snapshot fallback
 */
function shouldUseRealtimeMode() {
    const params = new URLSearchParams(window.location.search || '');
    const catalogParam = String(params.get('catalog') || '').trim();

    // Any ?catalog=... value means using explicit snapshot/root URL mode.
    if (catalogParam) {
        console.log(`[VBook Catalog] Snapshot mode forced via ?catalog=${catalogParam}`);
        return false;
    }

    // Check explicit realtime parameter
    const realtimeParam = String(params.get('realtime') || params.get('live') || '').trim().toLowerCase();
    if (realtimeParam === '0' || realtimeParam === 'false' || realtimeParam === 'off' || realtimeParam === 'no') {
        console.log('[VBook Catalog] Snapshot mode forced via query parameter');
        return false;
    }

    // DEFAULT: Always use realtime mode (try fresh data first)
    console.log('[VBook Catalog] Realtime mode enabled (default)');
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

function buildAggregateCopyUrl(preferredUrl) {
    const candidate = String(preferredUrl || '').trim();
    if (candidate) {
        return candidate;
    }

    return absoluteUrlFromRelative('./plugin.json');
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

function hydrateSiteHealthData(data) {
    const map = {};

    const metadata = data && data.metadata && typeof data.metadata === 'object'
        ? data.metadata
        : {
            timestamp: data && data.generatedAt ? data.generatedAt : '',
            totalChecked: Array.isArray(data && data.items) ? data.items.length : 0,
            stats: data && data.summary ? {
                ok: Number(data.summary.ok || 0),
                redirected: Number(data.summary.redirected || 0),
                cloudflare: Number(data.summary.cloudflare || 0),
                dead: Number(data.summary.dead || 0),
                uncertain: Number(data.summary.uncertain || 0)
            } : {
                ok: 0,
                redirected: 0,
                cloudflare: 0,
                dead: 0,
                uncertain: 0
            }
        };

    window.siteHealthMeta = {
        timestamp: metadata.timestamp || '',
        totalChecked: Number(metadata.totalChecked || 0),
        stats: {
            ok: Number(metadata.stats && metadata.stats.ok || 0),
            redirected: Number(metadata.stats && metadata.stats.redirected || 0),
            cloudflare: Number(metadata.stats && metadata.stats.cloudflare || 0),
            dead: Number(metadata.stats && metadata.stats.dead || 0),
            uncertain: Number(metadata.stats && metadata.stats.uncertain || 0)
        }
    };

    if (data && data.byUrl && typeof data.byUrl === 'object') {
        Object.keys(data.byUrl).forEach((key) => {
            if (!key) {
                return;
            }

            map[key] = data.byUrl[key];
        });
    }

    if (data && Array.isArray(data.items)) {
        data.items.forEach((item) => {
            const key = item && item.normalizedUrl ? item.normalizedUrl : normalizeSiteUrlKey(item && item.url ? item.url : '');
            if (!key) {
                return;
            }

            if (!map[key]) {
                map[key] = item;
            }
        });
    }

    window.siteHealthByUrl = map;
}

async function loadSiteHealthData() {
    try {
        const response = await fetchWithTimeout('./site-health.json', DEFAULT_TIMEOUT_MS);
        if (!response.ok) {
            window.siteHealthByUrl = {};
            return;
        }

        const text = await response.text();
        const parsed = parseJsonLenient(text);
        hydrateSiteHealthData(parsed);
    } catch (_error) {
        window.siteHealthByUrl = {};
    }
}

async function loadExtensions(options = {}) {
    if (isLoadingExtensions) {
        return;
    }

    isLoadingExtensions = true;

    resetExtensionCatalog();
    window.catalogExtensions = [];
    window.catalogSources = [];
    window.catalogSourceExpandedState = {};

    const loadedAtIso = new Date().toISOString();

    try {
        // REALTIME MODE: Fetch fresh data from remote sources
        if (shouldUseRealtimeMode()) {
            try {
                console.log('[VBook Catalog] Loading realtime extension sources...');
            
            const sourceList = await loadRealtimeSourceList();
            console.log(`[VBook Catalog] Loaded ${sourceList.sources.length} realtime sources`);
            
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

                    console.log(`[VBook Catalog] ✓ Loaded ${itemCount} items from ${source.id}`);
                    
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
                    console.warn(`[VBook Catalog] ✗ Failed to load ${source.id}: ${error.message}`);
                    
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
            window.catalogMeta.aggregateCopyUrl = buildAggregateCopyUrl();

            hydrateFromRootCatalog(realtimeRoot);
            hydrateFromSourceCatalog(realtimeSidecar);
            await loadSiteHealthData();
            
                console.log(`[VBook Catalog] ✓ Realtime mode loaded successfully: ${realtimeRoot.data.length} extensions`);
                renderDashboard();
                return;
            } catch (error) {
                console.warn('[VBook Catalog] ✗ Realtime mode failed:', error);
                console.log('[VBook Catalog] Falling back to snapshot mode...');
            }
        }

        // SNAPSHOT MODE: Fallback to static cached data
        console.log('[VBook Catalog] Loading snapshot from web/plugin.json...');
        
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
        window.catalogMeta.aggregateCopyUrl = buildAggregateCopyUrl(window.catalogMeta.loadedCatalogUrl);

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

        await loadSiteHealthData();

        console.log(`[VBook Catalog] ⚠ Snapshot mode loaded (fallback): ${data.data.length} extensions`);
        renderDashboard();
    } catch (error) {
        console.error('[VBook Catalog] ✗ Failed to load extensions:', error);
        const catalogParam = String(new URLSearchParams(window.location.search || '').get('catalog') || '').trim();
        const failedToFetch = /Failed to fetch/i.test(String(error && error.message ? error.message : ''));
        const dnsHint = failedToFetch && catalogParam
            ? `<div style="margin-top:8px;color:#b91c1c;font-size:13px;">Gợi ý: URL catalog đang không truy cập được từ trình duyệt (DNS/network). Hãy kiểm tra domain trong <code>?catalog=...</code>. Ví dụ hợp lệ: <code>https://vbook-ext.vercel.app/api/plugin.json</code>.</div>`
            : '';

        document.getElementById('extensions-grid').innerHTML =
            `<div style="grid-column: 1/-1; padding: 20px; color: red;">
                Lỗi: Không thể tải plugin.json đúng cấu trúc root manifest. Error: ${escapeHtml(error.message)}
                ${dnsHint}
            </div>`;
    } finally {
        isLoadingExtensions = false;
    }
}

function setupLiveAutoRefresh() {
    if (liveRefreshTimer) {
        return;
    }

    const params = new URLSearchParams(window.location.search || '');
    const refreshSec = Number(params.get('refreshSec') || 30);
    const intervalMs = Number.isFinite(refreshSec) && refreshSec >= 10
        ? refreshSec * 1000
        : DEFAULT_REFRESH_INTERVAL_MS;

    liveRefreshTimer = setInterval(() => {
        if (document.hidden) {
            return;
        }

        loadExtensions({ reason: 'auto-refresh' });
    }, intervalMs);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadExtensions({ reason: 'tab-visible' });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadExtensions({ reason: 'initial' });
    setupLiveAutoRefresh();
});
