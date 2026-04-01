const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { relativeFromWorkspace, writeJson } = require('../core/migration-utils');

function readJsonSafe(filePath, fallbackValue) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return fallbackValue;
    }
}

function fetchText(url, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        let currentUrl = url;
        let redirects = 0;

        function requestOnce(targetUrl) {
            const client = targetUrl.startsWith('https://') ? https : http;
            const req = client.get(targetUrl, (res) => {
                const status = res.statusCode || 0;

                if (status >= 300 && status < 400 && res.headers.location) {
                    redirects += 1;
                    if (redirects > 5) {
                        reject(new Error(`Too many redirects for ${url}`));
                        return;
                    }

                    currentUrl = new URL(res.headers.location, targetUrl).toString();
                    requestOnce(currentUrl);
                    return;
                }

                if (status < 200 || status >= 300) {
                    reject(new Error(`HTTP ${status} for ${targetUrl}`));
                    return;
                }

                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const text = Buffer.concat(chunks).toString('utf8');
                    resolve({
                        url: targetUrl,
                        text,
                        etag: res.headers.etag || null,
                        lastModified: res.headers['last-modified'] || null
                    });
                });
            });

            req.on('error', reject);
            req.setTimeout(timeoutMs, () => {
                req.destroy(new Error(`Timeout after ${timeoutMs}ms for ${targetUrl}`));
            });
        }

        requestOnce(currentUrl);
    });
}

function digest(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function loadSourceConfig(workspaceRoot, configPath) {
    const resolved = configPath
        ? path.resolve(configPath)
        : path.join(workspaceRoot, 'references', 'remote-sources.json');

    const parsed = readJsonSafe(resolved, null);
    if (!parsed || !Array.isArray(parsed.sources)) {
        throw new Error(`Invalid remote source config: ${resolved}`);
    }

    return { path: resolved, data: parsed };
}

function syncOrMonitorRemoteSources(workspaceRoot, options = {}) {
    const mode = options.mode === 'monitor' ? 'monitor' : 'sync';
    const shouldWriteFiles = mode === 'sync';
    const shouldUpdateState = mode === 'sync';

    const { path: configPath, data: config } = loadSourceConfig(workspaceRoot, options.config);
    const statePath = path.join(workspaceRoot, 'tools', 'cli', 'reports', 'remote-sources-state.json');
    const monitorPath = path.join(workspaceRoot, 'tools', 'cli', 'reports', 'remote-sources-monitor.json');
    const prevState = readJsonSafe(statePath, { items: {} });
    const stateItems = prevState.items && typeof prevState.items === 'object' ? prevState.items : {};

    const generatedAt = new Date().toISOString();
    const results = [];

    const fetchAll = config.sources.map(async (source) => {
        const itemId = String(source.id || '').trim();
        const url = String(source.url || '').trim();
        const targetFile = String(source.targetFile || '').trim();

        if (!itemId || !url || !targetFile) {
            results.push({
                id: itemId || 'unknown',
                url,
                targetFile,
                status: 'error',
                error: 'Missing id/url/targetFile in references/remote-sources.json'
            });
            return;
        }

        try {
            const payload = await fetchText(url, options.timeoutMs || 30000);
            const hash = digest(payload.text);
            const previous = stateItems[itemId] || null;
            const changed = previous ? previous.hash !== hash : true;
            const absoluteTarget = path.join(workspaceRoot, targetFile);

            if (shouldWriteFiles) {
                fs.mkdirSync(path.dirname(absoluteTarget), { recursive: true });
                fs.writeFileSync(absoluteTarget, payload.text, 'utf8');
            }

            if (shouldUpdateState) {
                stateItems[itemId] = {
                    id: itemId,
                    url,
                    targetFile,
                    hash,
                    etag: payload.etag,
                    lastModified: payload.lastModified,
                    lastCheckedAt: generatedAt,
                    lastSyncedAt: generatedAt
                };
            }

            results.push({
                id: itemId,
                url,
                targetFile,
                status: changed ? 'changed' : 'unchanged',
                changed,
                previousHash: previous ? previous.hash : null,
                currentHash: hash
            });
        } catch (error) {
            results.push({
                id: itemId,
                url,
                targetFile,
                status: 'error',
                error: error.message
            });
        }
    });

    return Promise.all(fetchAll).then(() => {
        results.sort((a, b) => a.id.localeCompare(b.id));

        const summary = {
            total: results.length,
            changed: results.filter((item) => item.status === 'changed').length,
            unchanged: results.filter((item) => item.status === 'unchanged').length,
            errors: results.filter((item) => item.status === 'error').length,
            mode
        };

        const report = {
            generatedAt,
            mode,
            configPath: relativeFromWorkspace(workspaceRoot, configPath),
            summary,
            items: results
        };

        writeJson(monitorPath, report);

        if (shouldUpdateState) {
            writeJson(statePath, {
                generatedAt,
                configPath: relativeFromWorkspace(workspaceRoot, configPath),
                items: stateItems
            });
        }

        return {
            ...report,
            reportPath: relativeFromWorkspace(workspaceRoot, monitorPath),
            statePath: relativeFromWorkspace(workspaceRoot, statePath),
            wroteFiles: shouldWriteFiles,
            updatedState: shouldUpdateState
        };
    });
}

function printRemoteSourcesReport(report) {
    console.log('');
    console.log(`VBook Remote Sources ${report.mode === 'sync' ? 'Sync' : 'Monitor'} Report`);
    console.log('================================');
    console.log(`Config: ${report.configPath}`);
    console.log(`Report: ${report.reportPath}`);
    console.log(`Total: ${report.summary.total} | Changed: ${report.summary.changed} | Unchanged: ${report.summary.unchanged} | Errors: ${report.summary.errors}`);
}

module.exports = {
    syncOrMonitorRemoteSources,
    printRemoteSourcesReport
};
