#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');
const SOURCES_FILE = path.join(WORKSPACE_ROOT, 'references', 'remote-sources.json');
const BASELINE_FILE = path.join(WORKSPACE_ROOT, 'ref', 'monitor.json');
const REPORT_DIR = path.join(WORKSPACE_ROOT, 'tools', 'cli', 'reports');
const REPORT_FILE = path.join(REPORT_DIR, 'remote-sources-monitor.json');

function sha256(input) {
    return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

async function fetchText(url) {
    const response = await fetch(url, {
        redirect: 'follow',
        headers: {
            'user-agent': 'vbook-tool-monitor/1.0'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');

    return { text, etag, lastModified };
}

function stripJsonComments(text) {
    let result = '';
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
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
            // Skip rest of line
            while (i < text.length && text[i] !== '\n') {
                i++;
            }
            if (i < text.length) result += '\n';
            continue;
        }

        result += char;
    }

    return result;
}

function removeTrailingCommas(text) {
    return text.replace(/,(\s*[}\]])/g, '$1');
}

function parseSourceContent(text, id) {
    // Strip comments and trailing commas for more lenient JSON parsing
    let cleanedText = stripJsonComments(text);
    cleanedText = removeTrailingCommas(cleanedText);

    const parsed = JSON.parse(cleanedText);
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Source JSON is invalid');
    }

    return {
        contentType: Array.isArray(parsed.data) ? 'json' : 'unknown',
        itemCount: Array.isArray(parsed.data) ? parsed.data.length : 0,
        content: parsed
    };
}

function readJson(filePath, fallback = null) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_) {
        return fallback;
    }
}

function buildBaselineState(baseline) {
    if (baseline && baseline.state && typeof baseline.state === 'object') {
        return baseline.state;
    }

    if (!baseline || !Array.isArray(baseline.items)) {
        return {};
    }

    const state = {};
    for (const item of baseline.items) {
        if (!item || !item.id || !item.hash) {
            continue;
        }

        state[item.id] = {
            hash: item.hash,
            etag: item.etag || null,
            lastModified: item.lastModified || null,
            lastCheckedAt: baseline.generatedAt || null,
            lastSyncedAt: baseline.generatedAt || null,
            url: item.url || null
        };
    }

    return state;
}

function buildSnapshot(report, sourceConfig) {
    const state = {};

    for (const item of report.items) {
        if (!item || !item.id) {
            continue;
        }

        state[item.id] = {
            hash: item.hash || null,
            etag: item.etag || null,
            lastModified: item.lastModified || null,
            lastCheckedAt: report.generatedAt,
            lastSyncedAt: report.generatedAt,
            url: item.url || null
        };
    }

    return {
        generatedAt: report.generatedAt,
        mode: 'sync',
        summary: {
            total: report.summary.total,
            changed: report.summary.changed,
            unchanged: report.summary.unchanged,
            errors: report.summary.errors,
            mode: 'sync',
            autoSyncedOnChange: true
        },
        items: report.items,
        state,
        referenceListUrl: sourceConfig.referenceListUrl || null
    };
}

async function run() {
    const startedAt = new Date().toISOString();

    const sourceConfig = readJson(SOURCES_FILE, { sources: [] });
    const baseline = readJson(BASELINE_FILE, { state: {} });
    const baselineState = buildBaselineState(baseline);

    const sources = Array.isArray(sourceConfig.sources) ? sourceConfig.sources : [];
    const items = [];
    let changed = 0;
    let unchanged = 0;
    let errors = 0;

    for (const source of sources) {
        const id = String(source.id || '').trim();
        const url = String(source.url || '').trim();
        const avatar = String(source.avatar || '').trim();

        if (!id || !url) {
            errors += 1;
            items.push({
                id,
                url,
                avatar: avatar || null,
                status: 'error',
                changed: false,
                hash: null,
                error: 'Missing id or url in sources config'
            });
            continue;
        }

        try {
            const previous = baselineState[id] || null;
            const fetched = await fetchText(url);
            const hash = sha256(fetched.text);
            const parsed = parseSourceContent(fetched.text, id);

            let status = 'unchanged';
            let isChanged = false;

            if (!previous || !previous.hash) {
                status = 'new';
                isChanged = true;
                changed += 1;
            } else if (previous.hash !== hash) {
                status = 'changed';
                isChanged = true;
                changed += 1;
            } else {
                unchanged += 1;
            }

            items.push({
                id,
                url,
                avatar: avatar || null,
                status,
                changed: isChanged,
                hash,
                etag: fetched.etag,
                lastModified: fetched.lastModified,
                itemCount: parsed.itemCount,
                contentType: parsed.contentType,
                content: parsed.content,
                error: null
            });
        } catch (error) {
            errors += 1;
            items.push({
                id,
                url,
                avatar: avatar || null,
                status: 'error',
                changed: false,
                hash: null,
                error: error.message
            });
        }
    }

    const report = {
        generatedAt: new Date().toISOString(),
        mode: 'monitor',
        summary: {
            total: sources.length,
            changed,
            unchanged,
            errors,
            mode: 'monitor'
        },
        items,
        baselineGeneratedAt: baseline && baseline.generatedAt ? baseline.generatedAt : null,
        startedAt
    };

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(buildSnapshot(report, sourceConfig), null, 2), 'utf8');

    if (errors > 0) {
        console.log(`[monitor] completed with ${errors} error(s).`);
    }

    if (changed > 0) {
        console.log(`[monitor] detected ${changed} changed/new source(s).`);
    } else {
        console.log('[monitor] no source changes detected.');
    }
}

run().catch((error) => {
    console.error(`[monitor] fatal error: ${error.message}`);
    process.exitCode = 1;
});
