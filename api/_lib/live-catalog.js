const path = require('path');
const fs = require('fs');

const DEFAULT_CACHE_TTL_MS = Number(process.env.VBOOK_WEB_CACHE_TTL_MS || 15000);
const DEFAULT_TIMEOUT_MS = Number(process.env.VBOOK_WEB_FETCH_TIMEOUT_MS || 12000);

let liveSnapshotCache = null;

function safeReadJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
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

function parseLenientJson(text) {
    const cleaned = stripJsonComments(String(text || '')).trim();
    if (!cleaned) {
        throw new Error('Empty JSON payload');
    }

    return JSON.parse(cleaned);
}

function normalizeSourceEntry(source, index) {
    const id = String(source && source.id ? source.id : '').trim() || `source-${index + 1}`;
    const url = String(source && source.url ? source.url : '').trim();
    const avatar = String(source && source.avatar ? source.avatar : '').trim();

    return {
        id,
        url,
        avatar
    };
}

function loadReferenceSourceList(workspaceRoot) {
    const sourceListPath = path.join(workspaceRoot, 'references', 'remote-sources.json');
    const sourceList = safeReadJson(sourceListPath);

    if (!sourceList || typeof sourceList !== 'object' || !Array.isArray(sourceList.sources)) {
        throw new Error('references/remote-sources.json is missing or invalid');
    }

    return {
        generatedAt: new Date().toISOString(),
        source: 'references/remote-sources.json',
        referenceListUrl: sourceList.referenceListUrl || '',
        sources: sourceList.sources
            .map((source, index) => normalizeSourceEntry(source, index))
            .filter((source) => source.id && source.url)
    };
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

function flattenUniqueExtensions(sourceResults) {
    const seen = new Set();
    const flat = [];

    (sourceResults || []).forEach((sourceResult) => {
        const items = Array.isArray(sourceResult && sourceResult.items) ? sourceResult.items : [];

        items.forEach((item) => {
            if (!item || typeof item !== 'object') {
                return;
            }

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

async function fetchTextWithTimeout(url, timeoutMs) {
    if (typeof fetch !== 'function') {
        throw new Error('Global fetch is not available in this Node runtime');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                accept: 'application/json,text/plain;q=0.9,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return {
            text: await response.text(),
            finalUrl: response.url || url
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchSourceCatalog(source, options = {}) {
    const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
    const normalizedSource = normalizeSourceEntry(source, 0);

    try {
        const result = await fetchTextWithTimeout(normalizedSource.url, timeoutMs);
        const parsed = parseLenientJson(result.text);

        const items = Array.isArray(parsed.data)
            ? parsed.data
            : (Array.isArray(parsed.items)
                ? parsed.items.flatMap((item) => (Array.isArray(item && item.content && item.content.data) ? item.content.data : []))
                : []);

        if (!Array.isArray(items)) {
            throw new Error('missing data[]');
        }

        return {
            id: normalizedSource.id,
            url: normalizedSource.url,
            avatar: normalizedSource.avatar,
            displayName: normalizedSource.id,
            fetchedUrl: result.finalUrl,
            status: 'active',
            itemCount: items.length,
            items
        };
    } catch (error) {
        return {
            id: normalizedSource.id,
            url: normalizedSource.url,
            avatar: normalizedSource.avatar,
            displayName: normalizedSource.id,
            fetchedUrl: normalizedSource.url,
            status: 'error',
            itemCount: 0,
            error: error && error.message ? error.message : 'fetch failed',
            items: []
        };
    }
}

async function buildLiveSnapshot(workspaceRoot, options = {}) {
    const sourceList = loadReferenceSourceList(workspaceRoot);
    const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);

    const sourceResults = await Promise.all(
        sourceList.sources.map((source) => fetchSourceCatalog(source, { timeoutMs }))
    );

    const data = flattenUniqueExtensions(sourceResults);
    const activeCount = sourceResults.filter((source) => source.status !== 'error').length;
    const errorCount = sourceResults.length - activeCount;

    return {
        sourceList,
        sourceResults,
        plugin: {
            metadata: {
                author: 'kychi',
                description: 'Community aggregate manifest',
                generatedAt: sourceList.generatedAt
            },
            referenceListUrl: sourceList.referenceListUrl || '',
            data
        },
        catalog: {
            metadata: {
                author: 'kychi',
                description: 'Community aggregate manifest',
                generatedAt: sourceList.generatedAt
            },
            summary: {
                total: sourceResults.length,
                changed: 0,
                unchanged: activeCount,
                errors: errorCount,
                mode: 'live'
            },
            referenceListUrl: sourceList.referenceListUrl || '',
            sources: sourceResults.map((result) => ({
                id: result.id,
                url: result.url,
                avatar: result.avatar,
                displayName: result.displayName,
                fetchedUrl: result.fetchedUrl,
                status: result.status,
                itemCount: result.itemCount,
                content: {
                    data: result.items
                },
                error: result.error
            }))
        },
        remoteSources: sourceList
    };
}

async function getLiveSnapshot(workspaceRoot, options = {}) {
    const now = Date.now();
    const ttlMs = Number(options.cacheTtlMs || DEFAULT_CACHE_TTL_MS);

    if (liveSnapshotCache && liveSnapshotCache.workspaceRoot === workspaceRoot && liveSnapshotCache.expiresAt > now) {
        return liveSnapshotCache.promise;
    }

    const promise = buildLiveSnapshot(workspaceRoot, options);
    liveSnapshotCache = {
        workspaceRoot,
        expiresAt: now + ttlMs,
        promise
    };

    return promise;
}

function resolveWorkspaceRoot() {
    return path.resolve(__dirname, '..', '..');
}

function getAllowedOrigin(req) {
    const explicit = String(process.env.VBOOK_ALLOWED_ORIGIN || '').trim();
    if (explicit) {
        return explicit;
    }

    const fallback = String(req && req.headers && req.headers.origin ? req.headers.origin : '').trim();
    return fallback || '*';
}

function applyCommonHeaders(req, res) {
    const allowedOrigin = getAllowedOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
}

function handlePreflight(req, res) {
    if (req.method !== 'OPTIONS') {
        return false;
    }

    applyCommonHeaders(req, res);
    res.statusCode = 204;
    res.end();
    return true;
}

async function getSnapshot(req) {
    const workspaceRoot = resolveWorkspaceRoot();
    const timeoutMs = Number(process.env.VBOOK_WEB_FETCH_TIMEOUT_MS || 12000);
    const cacheTtlMs = Number(process.env.VBOOK_WEB_CACHE_TTL_MS || 15000);

    return getLiveSnapshot(workspaceRoot, {
        timeoutMs,
        cacheTtlMs
    });
}

function getSourceList() {
    const workspaceRoot = resolveWorkspaceRoot();
    return loadReferenceSourceList(workspaceRoot);
}

function writeJson(req, res, payload, statusCode = 200) {
    applyCommonHeaders(req, res);
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

module.exports = {
    handlePreflight,
    getSnapshot,
    getSourceList,
    writeJson
};
