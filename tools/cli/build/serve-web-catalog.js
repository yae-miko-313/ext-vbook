const fs = require('fs');
const path = require('path');
const http = require('http');

const DEFAULT_PORT = Number(process.env.VBOOK_WEB_PORT || 8000);
const DEFAULT_HOST = process.env.VBOOK_WEB_HOST || '127.0.0.1';
const DEFAULT_CACHE_TTL_MS = Number(process.env.VBOOK_WEB_CACHE_TTL_MS || 15000);
const DEFAULT_TIMEOUT_MS = Number(process.env.VBOOK_WEB_FETCH_TIMEOUT_MS || 12000);

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

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
    const sourceListPath = path.join(workspaceRoot, '.private', 'references', 'remote-sources.json');
    const sourceList = safeReadJson(sourceListPath);

    if (!sourceList || typeof sourceList !== 'object' || !Array.isArray(sourceList.sources)) {
        throw new Error('.private/references/remote-sources.json is missing or invalid');
    }

    return {
        generatedAt: new Date().toISOString(),
        source: '.private/references/remote-sources.json',
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
            finalUrl: response.url || url,
            status: response.status,
            headers: response.headers
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
            content: {
                data: items
            }
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
            content: {
                data: []
            }
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
            sources: sourceResults
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

function getContentType(filePath) {
    return contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function serveStaticFile(res, filePath) {
    const data = await fs.promises.readFile(filePath);
    res.writeHead(200, {
        'Content-Type': getContentType(filePath),
        'Content-Length': data.length
    });
    res.end(data);
}

async function handleDynamicRoute(workspaceRoot, pathname, res, options) {
    const snapshot = await getLiveSnapshot(workspaceRoot, options);

    if (pathname === '/plugin.json') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(`${JSON.stringify(snapshot.plugin, null, 2)}\n`);
        return true;
    }

    if (pathname === '/catalog.json') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(`${JSON.stringify(snapshot.catalog, null, 2)}\n`);
        return true;
    }

    if (pathname === '/remote-sources.json') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(`${JSON.stringify(snapshot.remoteSources, null, 2)}\n`);
        return true;
    }

    return false;
}

async function startWebCatalogServer(workspaceRoot, options = {}) {
    const webRoot = path.join(workspaceRoot, 'web');
    const host = options.host || DEFAULT_HOST;
    const port = Number(options.port || DEFAULT_PORT);

    const server = http.createServer(async (req, res) => {
        try {
            const requestUrl = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);
            const pathname = decodeURIComponent(requestUrl.pathname || '/');

            if (await handleDynamicRoute(workspaceRoot, pathname, res, options)) {
                return;
            }

            let relativePath = pathname === '/' ? '/index.html' : pathname;
            relativePath = relativePath.replace(/^\/+/, '');

            const filePath = path.resolve(webRoot, relativePath);
            const normalizedWebRoot = path.resolve(webRoot) + path.sep;

            if (!filePath.startsWith(normalizedWebRoot) && filePath !== path.resolve(webRoot, 'index.html')) {
                res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Forbidden');
                return;
            }

            if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not Found');
                return;
            }

            await serveStaticFile(res, filePath);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: error && error.message ? error.message : 'Internal Server Error' }, null, 2));
        }
    });

    await new Promise((resolve) => {
        server.listen(port, host, resolve);
    });

    return {
        server,
        host,
        port
    };
}

if (require.main === module) {
    const workspaceRoot = path.resolve(__dirname, '..', '..', '..');

    startWebCatalogServer(workspaceRoot)
        .then(({ host, port }) => {
            console.log(`[web-catalog] live server running at http://${host}:${port}/`);
            console.log('[web-catalog] dynamic endpoints: /plugin.json, /catalog.json, /remote-sources.json');
        })
        .catch((error) => {
            console.error(`[web-catalog] ${error.message}`);
            process.exitCode = 1;
        });
}

module.exports = {
    startWebCatalogServer,
    buildLiveSnapshot,
    getLiveSnapshot,
    loadReferenceSourceList
};