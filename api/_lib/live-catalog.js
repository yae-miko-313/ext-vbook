const path = require('path');
const fs = require('fs');

const DEFAULT_CACHE_TTL_MS = Number(process.env.VBOOK_WEB_CACHE_TTL_MS || 10000);
const DEFAULT_TIMEOUT_MS = Number(process.env.VBOOK_WEB_FETCH_TIMEOUT_MS || 12000);

function loadJsonConfig(relativePath) {
    try {
        // Try Absolute path (best for Vercel/Node)
        const fullPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(fullPath)) {
            return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        }
        // Fallback to require for local modules
        return require('../../' + relativePath);
    } catch (e) {
        return null;
    }
}

let bundledSourceList = loadJsonConfig('web/remote-sources.json');
let referenceSourceList = loadJsonConfig('.private/references/remote-sources.json');

const { kv } = require('@vercel/kv');
const { waitUntil } = require('@vercel/functions');

const KV_HEALTH_KEY = 'vbook:site_health_v3';
const KV_CACHE_TTL = 30 * 60; // 30 minutes in seconds
const SCAN_TIMEOUT_MS = 5000;

let liveSnapshotCache = null;

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
    const sourceList = bundledSourceList || referenceSourceList;

    if (!sourceList || typeof sourceList !== 'object' || !Array.isArray(sourceList.sources)) {
        throw new Error('web/remote-sources.json or .private/references/remote-sources.json is missing or invalid');
    }

    return {
        generatedAt: new Date().toISOString(),
        source: bundledSourceList ? 'web/remote-sources.json' : '.private/references/remote-sources.json',
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json,text/plain;q=0.9,*/*;q=0.8',
                'Cache-Control': 'no-cache'
            }
        });

        const text = await response.text();
        
        return {
            text,
            finalUrl: response.url || url,
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchSourceCatalog(source, options = {}) {
    const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
    const normalizedSource = normalizeSourceEntry(source, 0);
    const originalUrl = normalizedSource.url;

    try {
        const result = await fetchTextWithTimeout(originalUrl, timeoutMs);
        
        // Detect detailed health state
        let state = 'active';
        let evidence = [];
        let confidence = 'high';

        // 1. HTTP Error Detect
        if (!result.ok) {
            state = 'dead';
            evidence.push({ type: 'http_error', strength: 'high', value: result.status });
        }

        // 2. Redirect Detect (Domain Change)
        try {
            const oldHost = new URL(originalUrl).hostname.replace(/^www\./, '');
            const newHost = new URL(result.finalUrl).hostname.replace(/^www\./, '');
            if (oldHost !== newHost && result.ok) {
                state = 'redirected';
                evidence.push({ type: 'http_301_302_host_changed', strength: 'high', value: newHost });
            }
        } catch (e) {}

        // 3. Cloudflare / Bot detection
        const cfHeaders = ['cf-ray', 'cf-cache-status', 'server'];
        const isCfServer = result.headers['server']?.toLowerCase().includes('cloudflare') || result.headers['cf-ray'];
        
        if (result.text.includes('cf-browser-verification') || 
            result.text.includes('Cloudflare Ray ID') ||
            (result.status === 403 && isCfServer)) {
            state = 'cloudflare';
            evidence.push({ type: 'cloudflare_detect', strength: 'high' });
        }

        // If dead or cloudflare, we still want to try parsing if there's text, 
        // but often the data will be invalid.
        let items = [];
        let parseError = null;

        try {
            const parsed = parseLenientJson(result.text);
            const rawItems = Array.isArray(parsed.data)
                ? parsed.data
                : (Array.isArray(parsed.items)
                    ? parsed.items.flatMap((item) => (Array.isArray(item && item.content && item.content.data) ? item.content.data : []))
                    : []);
            
            // Normalize items
            let baseUrl = result.finalUrl;
            try {
                const tempUrl = new URL(result.finalUrl);
                const pathParts = tempUrl.pathname.split('/');
                pathParts.pop();
                tempUrl.pathname = pathParts.join('/') + '/';
                baseUrl = tempUrl.toString();
            } catch {}

            items = (rawItems || []).map(item => {
                if (!item || typeof item !== 'object') return item;
                const newItem = { ...item };
                if (newItem.path && !newItem.path.startsWith('http')) {
                    newItem.path = new URL(newItem.path, baseUrl).toString();
                }
                if (newItem.icon && !newItem.icon.startsWith('http')) {
                    newItem.icon = new URL(newItem.icon, baseUrl).toString();
                }
                return newItem;
            });
        } catch (e) {
            parseError = e.message;
            if (state === 'active') {
                state = 'dead';
                evidence.push({ type: 'parse_error', strength: 'medium', value: e.message });
            }
        }

        return {
            id: normalizedSource.id,
            url: originalUrl,
            avatar: normalizedSource.avatar,
            displayName: normalizedSource.id,
            fetchedUrl: result.finalUrl,
            status: state === 'dead' ? 'error' : 'active',
            state,
            confidence,
            evidence,
            finalHost: state === 'redirected' ? new URL(result.finalUrl).hostname : null,
            itemCount: items.length,
            items,
            error: parseError
        };
    } catch (error) {
        return {
            id: normalizedSource.id,
            url: originalUrl,
            avatar: normalizedSource.avatar,
            displayName: normalizedSource.id,
            fetchedUrl: originalUrl,
            status: 'error',
            state: 'dead',
            confidence: 'high',
            evidence: [{ type: 'fetch_failed', strength: 'high', value: error && error.message }],
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
                state: result.state || (result.status === 'error' ? 'dead' : 'active'),
                confidence: result.confidence || 'high',
                evidence: result.evidence || [],
                finalHost: result.finalHost || null,
                itemCount: result.itemCount,
                extItems: result.items,
                error: result.error
            })),
            siteHealth: await buildSiteHealthMap(data, timeoutMs)
        },
        remoteSources: sourceList
    };
}

async function buildSiteHealthMap(extensions, timeoutMs) {
    const uniqueSites = new Set();
    (extensions || []).forEach(ext => {
        if (ext.source) {
            try {
                const url = new URL(ext.source);
                const protocol = url.protocol.toLowerCase();
                const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
                const pathname = url.pathname.replace(/\/+$/, '') || '/';
                uniqueSites.add(`${protocol}//${hostname}${pathname}`);
            } catch (e) {}
        }
    });

    const siteUrls = Array.from(uniqueSites);
    // Limit to avoid massive timeouts
    const results = await Promise.all(
        siteUrls.slice(0, 80).map(url => checkSiteHealth(url, Math.min(timeoutMs, SCAN_TIMEOUT_MS)))
    );

    const map = {};
    results.forEach(res => {
        map[res.url] = res;
    });
    return map;
}

const HIJACK_DOMAINS = [
    'shopee.vn', 'lazada.vn', 'tiki.vn', 'shope.ee', 's.shopee.vn',
    'sedo.com', 'hugedomains.com', 'namebright.com', 'dan.com', 'afternic.com',
    'parklogic.com', 'bodis.com'
];

async function checkSiteHealth(url, timeoutMs) {
    try {
        const result = await fetchTextWithTimeout(url, timeoutMs);
        
        // Advanced Detection Logic (Prefix: p, Suffix: s)
        let prefix = 'LIVE';
        let suffix = String(result.status);
        let evidence = [];

        // 1. Hijack Detection
        try {
            const finalUrlObj = new URL(result.finalUrl);
            const finalHost = finalUrlObj.hostname.toLowerCase().replace(/^www\./, '');
            const originalHost = new URL(url).hostname.toLowerCase().replace(/^www\./, '');

            const isHijacked = HIJACK_DOMAINS.some(d => finalHost.includes(d)) || 
                             finalUrlObj.pathname.includes('parking') ||
                             finalUrlObj.pathname.includes('buy-domain');

            if (isHijacked) {
                prefix = 'HIJACK';
                suffix = finalHost.includes('shopee') || finalHost.includes('lazada') ? 'SHOP' : 'PARK';
                evidence.push({ type: 'hijack_detected', value: finalHost });
            } else if (originalHost !== finalHost && result.ok) {
                prefix = 'MOVE';
                suffix = finalHost.length > 12 ? finalHost.substring(0, 10) + '..' : finalHost;
                evidence.push({ type: 'domain_changed', value: finalHost });
            }
        } catch (e) {}

        // 2. WAF / Cloudflare Detection
        const isCfServer = result.headers['server']?.toLowerCase().includes('cloudflare') || result.headers['cf-ray'];
        if (result.text.includes('cf-browser-verification') || 
            result.text.includes('Cloudflare Ray ID') ||
            (result.status === 403 && isCfServer)) {
            prefix = 'FAIL';
            suffix = 'WAF';
            evidence.push({ type: 'cloudflare_blocked' });
        }

        // 3. Status Error
        if (prefix === 'LIVE' && !result.ok) {
            prefix = 'DIE';
            suffix = String(result.status);
            evidence.push({ type: 'http_error', value: result.status });
        }

        return {
            url,
            p: prefix,
            s: suffix,
            state: prefix.toLowerCase(),
            evidence,
            status: result.status,
            finalUrl: result.finalUrl
        };
    } catch (error) {
        let suffix = 'CONN';
        if (error.name === 'AbortError') suffix = 'TOUT';
        
        return {
            url,
            p: 'DIE',
            s: suffix,
            state: 'dead',
            error: error.message
        };
    }
}

const KV_FULL_SNAPSHOT_KEY = 'vbook:full_snapshot_v3';

async function getSnapshot(req) {
    const now = Date.now();
    const workspaceRoot = resolveWorkspaceRoot();

    // Tier 1: Memory Cache (Very fast, expires in 30s)
    if (liveSnapshotCache && liveSnapshotCache.expiresAt > now) {
        return liveSnapshotCache.data;
    }

    // Tier 2: KV Cache (Fast, global)
    let kvData = null;
    try {
        kvData = await kv.get(KV_FULL_SNAPSHOT_KEY);
    } catch (e) {
        console.warn('[KV] Error fetching full snapshot:', e.message);
    }

    if (kvData) {
        // Return immediately
        liveSnapshotCache = {
            data: kvData,
            expiresAt: now + 30000 // 30s memory cache
        };

        // Background revalidation if stale
        const generatedAt = new Date(kvData.catalog?.metadata?.generatedAt || 0).getTime();
        if (now - generatedAt > KV_CACHE_TTL * 1000) {
            console.log('[KV] Full snapshot is stale. Revalidating in background...');
            waitUntil(refreshAndCacheSnapshot(workspaceRoot));
        }

        return kvData;
    }

    // Tier 3: Cold Start (Slow)
    console.log('[KV] Cold start. Building fresh snapshot...');
    return await refreshAndCacheSnapshot(workspaceRoot);
}

async function refreshAndCacheSnapshot(workspaceRoot) {
    try {
        const snapshot = await buildLiveSnapshot(workspaceRoot);
        // Add health check
        const healthMap = await buildSiteHealthMap(snapshot.plugin.data, SCAN_TIMEOUT_MS);
        snapshot.catalog.siteHealth = healthMap;
        snapshot.catalog.metadata.generatedAt = new Date().toISOString();
        
        // Cache to KV
        await kv.set(KV_FULL_SNAPSHOT_KEY, snapshot, { ex: KV_CACHE_TTL * 4 });
        
        // Update Memory Cache
        liveSnapshotCache = {
            data: snapshot,
            expiresAt: Date.now() + 30000
        };
        
        return snapshot;
    } catch (e) {
        console.error('[Refresh] Failed:', e.message);
        throw e;
    }
}



function resolveWorkspaceRoot() {
    return path.resolve(__dirname, '..', '..');
}

function normalizeOriginValue(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw === '*') return '*';
    try {
        return new URL(raw).origin;
    } catch {
        return raw.replace(/\/+$/, '');
    }
}

function originMatchesRule(origin, rule) {
    if (!origin || !rule) return false;
    if (rule === '*') return true;
    if (origin === rule) return true;
    if (rule.startsWith('*.')) {
        try {
            const host = new URL(origin).hostname;
            const suffix = rule.slice(1).toLowerCase();
            return host.toLowerCase().endsWith(suffix);
        } catch {
            return false;
        }
    }
    return false;
}

function getAllowedOrigin(req) {
    const requestOrigin = normalizeOriginValue(req && req.headers && req.headers.origin ? req.headers.origin : '');
    const explicit = String(process.env.VBOOK_ALLOWED_ORIGIN || '').trim();

    if (explicit) {
        const rules = explicit.split(',').map((item) => normalizeOriginValue(item)).filter(Boolean);
        if (!rules.length) return requestOrigin || '*';
        if (!requestOrigin) return rules[0];
        if (rules.some((rule) => originMatchesRule(requestOrigin, rule))) return requestOrigin;
        return rules[0];
    }
    return requestOrigin || '*';
}

function applyCommonHeaders(req, res, customHeaders = {}) {
    const allowedOrigin = getAllowedOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
    
    if (customHeaders['Cache-Control']) {
        res.setHeader('Cache-Control', customHeaders['Cache-Control']);
    } else {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}

function handlePreflight(req, res) {
    if (req.method !== 'OPTIONS') return false;
    applyCommonHeaders(req, res);
    res.statusCode = 204;
    res.end();
    return true;
}

function getSourceList() {
    const workspaceRoot = resolveWorkspaceRoot();
    return loadReferenceSourceList(workspaceRoot);
}

function writeJson(req, res, payload, statusCode = 200, customHeaders = {}) {
    applyCommonHeaders(req, res, customHeaders);
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
