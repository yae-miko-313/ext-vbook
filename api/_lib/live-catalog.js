'use strict';

const path = require('path');
const fs = require('fs');
const { kv } = require('@vercel/kv');
const { waitUntil } = require('@vercel/functions');
const { getStorageProvider } = require('./catalog-storage');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DEFAULT_TIMEOUT_MS = Number(process.env.VBOOK_WEB_FETCH_TIMEOUT_MS || 12000);
const KV_FULL_SNAPSHOT_KEY = 'vbook:full_snapshot_v4';
const KV_STALE_THRESHOLD_SEC = 30 * 60;      // 30 min: revalidate in background
const KV_PERSIST_TTL_SEC = 7 * 24 * 60 * 60; // 7 days: never auto-expire
const HEALTH_TIMEOUT_MS = 5000;
const HEALTH_BATCH_SIZE = 50;

const isKvConfigured = Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

// Module-level in-memory cache (shared across invocations in the same VM instance)
let memCache = null;

// ---------------------------------------------------------------------------
// Source list loading
// ---------------------------------------------------------------------------
function loadSourceListConfig() {
    try {
        // Use explicit literal require() so Vercel's node-file-trace (nft) 
        // can statically analyze and bundle these JSON files.
        return require('../../web/remote-sources.json');
    } catch (e1) {
        try {
            return require('../../.private/references/remote-sources.json');
        } catch (e2) {
            return null;
        }
    }
}

const bundledSourceList = loadSourceListConfig();

// For realtime beta: load fresh config every time
function loadSourceListConfigRealtime() {
    try {
        // Clear require cache to get fresh file
        const configPath = require.resolve('../../web/remote-sources.json');
        delete require.cache[configPath];
        return require('../../web/remote-sources.json');
    } catch (e1) {
        try {
            const privatePath = require.resolve('../../.private/references/remote-sources.json');
            delete require.cache[privatePath];
            return require('../../.private/references/remote-sources.json');
        } catch (e2) {
            return null;
        }
    }
}

function loadReferenceSourceList(isRealtime = false) {
    // Use fresh load for realtime mode, cached for normal mode
    const sourceList = isRealtime ? loadSourceListConfigRealtime() : bundledSourceList;
    
    if (!sourceList || !Array.isArray(sourceList.sources)) {
        throw new Error(
            'web/remote-sources.json or .private/references/remote-sources.json is missing or invalid'
        );
    }
    return {
        generatedAt: new Date().toISOString(),
        referenceListUrl: sourceList.referenceListUrl || '',
        sources: sourceList.sources
            .map((s, i) => ({
                id: String(s.id || `source-${i + 1}`).trim(),
                url: String(s.url || '').trim(),
                avatar: String(s.avatar || '').trim()
            }))
            .filter(s => s.id && s.url)
    };
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------
function stripJsonComments(text) {
    let out = '';
    let inStr = false;
    let esc = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (esc) { out += c; esc = false; continue; }
        if (c === '\\') { out += c; esc = true; continue; }
        if (c === '"') { inStr = !inStr; out += c; continue; }
        if (!inStr && c === '/' && text[i + 1] === '/') {
            while (i < text.length && text[i] !== '\n') i++;
            if (i < text.length) out += '\n';
            continue;
        }
        out += c;
    }
    return out;
}

function parseLenientJson(text) {
    const cleaned = stripJsonComments(String(text || '')).trim();
    if (!cleaned) throw new Error('Empty JSON payload');
    return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Dedup extensions
// ---------------------------------------------------------------------------
function makeExtKey(item) {
    const n = v => String(v || '').trim().toLowerCase();
    if (n(item.path)) return `path:${n(item.path)}`;
    return `sig:${n(item.name)}|${n(item.author)}|${n(item.source)}|${n(item.type)}`;
}

function flattenUnique(sourceResults) {
    const seen = new Set();
    const flat = [];
    for (const result of (sourceResults || [])) {
        for (const item of (result.items || [])) {
            if (!item || typeof item !== 'object') continue;
            const key = makeExtKey(item);
            if (seen.has(key)) continue;
            seen.add(key);
            flat.push(item);
        }
    }
    return flat;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------
async function fetchWithTimeout(url, timeoutMs) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; vbook-catalog-bot/4.0)',
                'Accept': 'application/json, text/plain;q=0.9, */*;q=0.8',
                'Cache-Control': 'no-cache'
            }
        });
        const text = await res.text();
        return {
            text,
            finalUrl: res.url || url,
            status: res.status,
            ok: res.ok,
            headers: Object.fromEntries(res.headers.entries())
        };
    } finally {
        clearTimeout(t);
    }
}

// ---------------------------------------------------------------------------
// Fetch one source repo's plugin.json
// ---------------------------------------------------------------------------
async function fetchSourceCatalog(source) {
    const { id, url, avatar } = source;
    try {
        const res = await fetchWithTimeout(url, DEFAULT_TIMEOUT_MS);
        let state = 'active';
        const evidence = [];

        if (!res.ok) {
            state = 'dead';
            evidence.push({ type: 'http_error', value: res.status });
        }

        // Redirect / domain change detection
        try {
            const oldHost = new URL(url).hostname.replace(/^www\./, '');
            const newHost = new URL(res.finalUrl).hostname.replace(/^www\./, '');
            if (oldHost !== newHost && res.ok) {
                state = 'redirected';
                evidence.push({ type: 'domain_changed', value: newHost });
            }
        } catch (_) {}

        // Cloudflare detection
        const isCf = res.headers['server']?.toLowerCase().includes('cloudflare') ||
                     Boolean(res.headers['cf-ray']);
        if (
            res.text.includes('cf-browser-verification') ||
            res.text.includes('Cloudflare Ray ID') ||
            (res.status === 403 && isCf)
        ) {
            state = 'cloudflare';
            evidence.push({ type: 'cloudflare_detected' });
        }

        let items = [];
        let parseError = null;
        try {
            const parsed = parseLenientJson(res.text);
            const raw = Array.isArray(parsed.data)
                ? parsed.data
                : (parsed.items || []).flatMap(it =>
                    Array.isArray(it?.content?.data) ? it.content.data : []
                  );

            // Resolve relative paths using finalUrl as base
            let baseUrl = res.finalUrl;
            try {
                const u = new URL(res.finalUrl);
                const parts = u.pathname.split('/');
                parts.pop();
                u.pathname = parts.join('/') + '/';
                baseUrl = u.toString();
            } catch (_) {}

            items = (raw || []).map(item => {
                if (!item || typeof item !== 'object') return item;
                const out = { ...item };
                if (out.path && !out.path.startsWith('http')) {
                    try { out.path = new URL(out.path, baseUrl).toString(); } catch (_) {}
                }
                if (out.icon && !out.icon.startsWith('http')) {
                    try { out.icon = new URL(out.icon, baseUrl).toString(); } catch (_) {}
                }
                return out;
            });
        } catch (e) {
            parseError = e.message;
            if (state === 'active') {
                state = 'dead';
                evidence.push({ type: 'parse_error', value: e.message });
            }
        }

        return {
            id, url, avatar,
            displayName: id,
            fetchedUrl: res.finalUrl,
            status: state === 'dead' ? 'error' : 'active',
            state, evidence,
            finalHost: state === 'redirected' ? new URL(res.finalUrl).hostname : null,
            itemCount: items.length,
            items,
            error: parseError
        };
    } catch (err) {
        return {
            id, url, avatar,
            displayName: id,
            fetchedUrl: url,
            status: 'error',
            state: 'dead',
            evidence: [{ type: 'fetch_failed', value: err?.message }],
            itemCount: 0,
            items: [],
            error: err?.message || 'fetch failed'
        };
    }
}

// ---------------------------------------------------------------------------
// Build full snapshot (no health) - fast (~1-2s on cold start)
// ---------------------------------------------------------------------------
async function buildLiveSnapshot(isRealtime = false) {
    const sourceList = loadReferenceSourceList(isRealtime);

    const sourceResults = await Promise.all(
        sourceList.sources.map(s => fetchSourceCatalog(s))
    );

    const data = flattenUnique(sourceResults);
    const activeCount = sourceResults.filter(s => s.status !== 'error').length;
    const errorCount = sourceResults.length - activeCount;
    const now = new Date().toISOString();

    return {
        sourceList,
        plugin: {
            metadata: {
                author: 'kychi',
                description: 'Community aggregate manifest',
                generatedAt: now
            },
            referenceListUrl: sourceList.referenceListUrl,
            data
        },
        catalog: {
            metadata: {
                author: 'kychi',
                description: 'Community aggregate manifest',
                generatedAt: now
            },
            summary: {
                total: sourceResults.length,
                unchanged: activeCount,
                errors: errorCount,
                mode: 'live'
            },
            referenceListUrl: sourceList.referenceListUrl,
            sources: sourceResults.map(r => ({
                id: r.id,
                url: r.url,
                avatar: r.avatar,
                displayName: r.displayName,
                fetchedUrl: r.fetchedUrl,
                status: r.status,
                state: r.state,
                evidence: r.evidence,
                finalHost: r.finalHost,
                itemCount: r.itemCount,
                extItems: r.items,
                error: r.error
            })),
            siteHealth: {} // Populated by background refresh
        }
    };
}

// ---------------------------------------------------------------------------
// Health check (slow, runs in background only)
// ---------------------------------------------------------------------------
const HIJACK_DOMAINS = [
    'shopee.vn', 'lazada.vn', 'tiki.vn', 'shope.ee', 's.shopee.vn',
    'sedo.com', 'hugedomains.com', 'namebright.com', 'dan.com',
    'afternic.com', 'parklogic.com', 'bodis.com'
];

async function checkSiteHealth(url) {
    try {
        const res = await fetchWithTimeout(url, HEALTH_TIMEOUT_MS);
        let p = 'LIVE';
        let s = String(res.status);

        try {
            const finalHost = new URL(res.finalUrl).hostname.toLowerCase().replace(/^www\./, '');
            const origHost = new URL(url).hostname.toLowerCase().replace(/^www\./, '');

            const hijacked = HIJACK_DOMAINS.some(d => finalHost.includes(d)) ||
                             res.finalUrl.includes('parking') ||
                             res.finalUrl.includes('buy-domain');

            if (hijacked) {
                p = 'HIJACK';
                s = finalHost.includes('shopee') || finalHost.includes('lazada') ? 'SHOP' : 'PARK';
            } else if (origHost !== finalHost && res.ok) {
                p = 'MOVE';
                s = finalHost.length > 12 ? finalHost.substring(0, 10) + '..' : finalHost;
            }
        } catch (_) {}

        const isCf = res.headers['server']?.toLowerCase().includes('cloudflare') ||
                     Boolean(res.headers['cf-ray']);
        if (
            res.text.includes('cf-browser-verification') ||
            res.text.includes('Cloudflare Ray ID') ||
            (res.status === 403 && isCf)
        ) {
            p = 'FAIL'; s = 'WAF';
        }

        if (p === 'LIVE' && !res.ok) { p = 'DIE'; s = String(res.status); }

        return { url, p, s, state: p.toLowerCase(), status: res.status, finalUrl: res.finalUrl };
    } catch (err) {
        return { url, p: 'DIE', s: err.name === 'AbortError' ? 'TOUT' : 'CONN', state: 'dead' };
    }
}

async function buildSiteHealthMap(extensions) {
    const sites = new Set();
    for (const ext of (extensions || [])) {
        if (!ext.source) continue;
        try {
            const u = new URL(ext.source);
            sites.add(`${u.protocol.toLowerCase()}//${u.hostname.toLowerCase().replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '') || '/'}`);
        } catch (_) {}
    }

    const urls = Array.from(sites).slice(0, 250);
    const map = {};

    for (let i = 0; i < urls.length; i += HEALTH_BATCH_SIZE) {
        const batch = urls.slice(i, i + HEALTH_BATCH_SIZE);
        const results = await Promise.all(batch.map(u => checkSiteHealth(u)));
        for (const r of results) map[r.url] = r;
    }
    return map;
}

// ---------------------------------------------------------------------------
// Background: refresh + health + save to KV
// ---------------------------------------------------------------------------
async function runBackgroundRefresh(baseSnapshot, req = null) {
    try {
        console.log('[Refresh] Starting background health scan...');
        const snapshot = baseSnapshot || await buildLiveSnapshot();
        const storage = getStorageProvider(req);

        const healthMap = await buildSiteHealthMap(snapshot.plugin.data);
        snapshot.catalog.siteHealth = healthMap;

        const ts = new Date().toISOString();
        snapshot.catalog.metadata.generatedAt = ts;
        snapshot.healthUpdatedAt = ts;

        try {
            await storage.set(snapshot);
            console.log(`[Refresh] ${storage === kv ? 'KV' : 'Supabase'} updated at`, ts);
        } catch (e) {
            console.error('[Refresh] Storage save failed:', e.message);
        }

        memCache = { data: snapshot, expiresAt: Date.now() + 60_000 };
        return snapshot;
    } catch (e) {
        console.error('[Refresh] Background scan failed:', e.message);
    }
}

// ---------------------------------------------------------------------------
// getSnapshot - the only exported cache entry point
// Tier 1: in-memory  (<1ms)
// Tier 2: KV         (<50ms)
// Tier 3: live fetch from GitHub (~1-2s, no health, triggers bg refresh)
// ---------------------------------------------------------------------------
async function getSnapshot(req = null) {
    const now = Date.now();
    const storage = getStorageProvider(req);

    // Tier 1: Memory (Only for Stable to keep it blazing fast)
    const isBeta = req === true || (req && (req.query?.v === 'beta' || req.headers?.referer?.includes('/customizer')));
    if (!isBeta && memCache && memCache.expiresAt > now) {
        return memCache.data;
    }

    // Tier 2: Storage (KV or Supabase)
    try {
        const cached = await storage.get();
        if (cached) {
            if (!isBeta) memCache = { data: cached, expiresAt: now + 60_000 };

            const age = (now - new Date(cached.catalog?.metadata?.generatedAt || 0).getTime()) / 1000;
            if (age > KV_STALE_THRESHOLD_SEC) {
                console.log(`[Storage] Stale (${Math.floor(age / 60)}m). Revalidating in background...`);
                waitUntil(runBackgroundRefresh(null, req));
            }

            return cached;
        }
        console.log(`[Storage] ${isBeta ? 'Supabase' : 'KV'} cache miss.`);
    } catch (e) {
        console.error(`[Storage] ${isBeta ? 'Supabase' : 'KV'} read error:`, e.message);
    }

    // Tier 3: Cold start: fetch raw from GitHub (fast, no health scan)
    // For beta: use realtime mode (fresh config load), for stable: use cached config
    console.log(`[Cold Start] Fetching from GitHub... (realtime=${isBeta})`);
    const snapshot = await buildLiveSnapshot(isBeta);
    if (!isBeta) memCache = { data: snapshot, expiresAt: now + 60_000 };

    // Run health + save in background
    waitUntil(runBackgroundRefresh(snapshot, req));

    return snapshot;
}

// ---------------------------------------------------------------------------
// CORS / HTTP helpers
// ---------------------------------------------------------------------------
function normalizeOrigin(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === '*') return raw;
    try { return new URL(raw).origin; } catch { return raw.replace(/\/+$/, ''); }
}

function originMatchesRule(origin, rule) {
    if (!origin || !rule) return false;
    if (rule === '*' || origin === rule) return true;
    if (rule.startsWith('*.')) {
        try {
            const suffix = rule.slice(1).toLowerCase();
            return new URL(origin).hostname.toLowerCase().endsWith(suffix);
        } catch { return false; }
    }
    return false;
}

function getAllowedOrigin(req) {
    const reqOrigin = normalizeOrigin(req?.headers?.origin || '');
    const explicit = String(process.env.VBOOK_ALLOWED_ORIGIN || '').trim();
    if (!explicit) return reqOrigin || '*';

    const rules = explicit.split(',').map(normalizeOrigin).filter(Boolean);
    if (!rules.length) return reqOrigin || '*';
    if (!reqOrigin) return rules[0];
    return rules.some(r => originMatchesRule(reqOrigin, r)) ? reqOrigin : rules[0];
}

function applyCommonHeaders(req, res, customHeaders = {}) {
    res.setHeader('Access-Control-Allow-Origin', getAllowedOrigin(req));
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

function writeJson(req, res, payload, statusCode = 200, customHeaders = {}) {
    applyCommonHeaders(req, res, customHeaders);
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function getSourceList() {
    return loadReferenceSourceList();
}

// ---------------------------------------------------------------------------
module.exports = { handlePreflight, getSnapshot, getSourceList, writeJson };
