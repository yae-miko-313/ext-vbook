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

function readJson(filePath, fallback = null) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_) {
        return fallback;
    }
}

async function run() {
    const startedAt = new Date().toISOString();

    const sourceConfig = readJson(SOURCES_FILE, { sources: [] });
    const baseline = readJson(BASELINE_FILE, { state: {} });
    const baselineState = baseline && baseline.state ? baseline.state : {};

    const sources = Array.isArray(sourceConfig.sources) ? sourceConfig.sources : [];
    const items = [];
    let changed = 0;
    let unchanged = 0;
    let errors = 0;

    for (const source of sources) {
        const id = String(source.id || '').trim();
        const url = String(source.url || '').trim();

        if (!id || !url) {
            errors += 1;
            items.push({
                id,
                url,
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
                status,
                changed: isChanged,
                hash,
                etag: fetched.etag,
                lastModified: fetched.lastModified,
                error: null
            });
        } catch (error) {
            errors += 1;
            items.push({
                id,
                url,
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
