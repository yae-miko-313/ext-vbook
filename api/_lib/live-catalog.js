const path = require('path');
const {
    getLiveSnapshot,
    loadReferenceSourceList
} = require('../../tools/cli/build/serve-web-catalog');

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
