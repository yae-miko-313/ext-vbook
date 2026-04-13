const fs = require('fs');
const path = require('path');

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_MAX_REDIRECTS = 8;

const SUBDOMAIN_MIGRATION_PREFIXES = new Set([
    'www', 'm', 'mobile', 'old', 'old-version', 'beta', 'legacy'
]);

function safeReadJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
}

function normalizeHost(input) {
    if (!input) {
        return '';
    }

    try {
        const asUrl = String(input).includes('://') ? new URL(String(input)) : new URL(`https://${String(input)}`);
        return asUrl.hostname.toLowerCase().replace(/^www\./, '').trim();
    } catch {
        return '';
    }
}

function normalizeHostComparable(host) {
    const normalized = normalizeHost(host);
    if (!normalized) {
        return '';
    }

    const parts = normalized.split('.').filter(Boolean);
    if (parts.length >= 3 && SUBDOMAIN_MIGRATION_PREFIXES.has(parts[0])) {
        return parts.slice(1).join('.');
    }

    return normalized;
}

function isHostChange(sourceHost, finalHost) {
    const left = normalizeHostComparable(sourceHost);
    const right = normalizeHostComparable(finalHost);
    if (!left || !right) {
        return false;
    }

    return left !== right;
}

function normalizeSiteUrlKey(rawUrl) {
    try {
        const parsed = new URL(String(rawUrl || '').trim());
        const protocol = parsed.protocol.toLowerCase();
        const hostname = normalizeHost(parsed.hostname);
        const port = parsed.port && !((protocol === 'http:' && parsed.port === '80') || (protocol === 'https:' && parsed.port === '443'))
            ? `:${parsed.port}`
            : '';
        const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
        return `${protocol}//${hostname}${port}${pathname}`;
    } catch {
        return '';
    }
}

function toHttpUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol === 'https:') {
            parsed.protocol = 'http:';
        }
        return parsed.toString();
    } catch {
        return rawUrl;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTlsError(error) {
    const message = String(error && error.message ? error.message : '').toLowerCase();
    return /tls|ssl|certificate|cert|eproto|self signed|unable to verify/i.test(message);
}

function detectCloudflareEvidence(response, htmlText) {
    const evidence = [];
    const cfRay = response.headers.get('cf-ray');

    if (cfRay) {
        evidence.push({
            type: 'cf_ray_header',
            strength: 'strong',
            details: { cfRay }
        });
    }

    const serverHeader = String(response.headers.get('server') || '').toLowerCase();
    if (serverHeader.includes('cloudflare')) {
        evidence.push({
            type: 'cloudflare_server_header',
            strength: 'medium',
            details: { server: serverHeader }
        });
    }

    const sample = String(htmlText || '').slice(0, 12000).toLowerCase();
    const challengePattern = /just a moment|attention required|checking your browser|cf-chl|cdn-cgi\/challenge-platform|verify you are human|captcha/;
    if (challengePattern.test(sample)) {
        evidence.push({
            type: 'cloudflare_challenge_page',
            strength: 'strong',
            details: {}
        });
    }

    return evidence;
}

function detectMetaRefreshEvidence(sourceHost, htmlText) {
    const match = String(htmlText || '').match(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*content=["'][^"'>]*url=([^"'>]+)["'][^>]*>/i);
    if (!match || !match[1]) {
        return null;
    }

    const target = match[1].trim();
    const targetHost = normalizeHost(target);
    if (!targetHost || !isHostChange(sourceHost, targetHost)) {
        return null;
    }

    return {
        type: 'meta_refresh_cross_domain',
        strength: 'strong',
        details: {
            targetUrl: target,
            targetHost
        }
    };
}

function detectCanonicalEvidence(sourceHost, htmlText) {
    const match = String(htmlText || '').match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"'>]+)["'][^>]*>/i);
    if (!match || !match[1]) {
        return null;
    }

    const target = match[1].trim();
    const targetHost = normalizeHost(target);
    if (!targetHost || !isHostChange(sourceHost, targetHost)) {
        return null;
    }

    return {
        type: 'canonical_link_cross_domain',
        strength: 'strong',
        details: {
            targetUrl: target,
            targetHost
        }
    };
}

function detectMigrationTextEvidence(sourceHost, htmlText) {
    const sample = String(htmlText || '').slice(0, 80000);
    const regex = /(moved to|new domain|domain mới|chuyển sang|chuyen sang|chuyển đến|chuyen den|trang mới|website mới|đổi miền|doi mien)[^<\n]{0,220}(https?:\/\/[^\s"'<>]+)/i;
    const match = sample.match(regex);

    if (!match || !match[2]) {
        return null;
    }

    const targetUrl = match[2].trim();
    const targetHost = normalizeHost(targetUrl);
    if (!targetHost || !isHostChange(sourceHost, targetHost)) {
        return null;
    }

    return {
        type: 'migration_text_with_url',
        strength: 'strong',
        details: {
            phrase: match[1],
            targetUrl,
            targetHost
        }
    };
}

function collectEvidence(sourceUrl, response, htmlText, redirectChain, finalUrl) {
    const evidence = [];
    const sourceHost = normalizeHost(sourceUrl);
    const finalHost = normalizeHost(finalUrl);

    if (Array.isArray(redirectChain) && redirectChain.length > 0 && isHostChange(sourceHost, finalHost)) {
        evidence.push({
            type: 'http_301_302_host_changed',
            strength: 'strong',
            details: {
                hops: redirectChain.length,
                from: sourceHost,
                to: finalHost
            }
        });
    }

    const cfEvidence = detectCloudflareEvidence(response, htmlText);
    cfEvidence.forEach((item) => evidence.push(item));

    const metaEvidence = detectMetaRefreshEvidence(sourceHost, htmlText);
    if (metaEvidence) {
        evidence.push(metaEvidence);
    }

    const canonicalEvidence = detectCanonicalEvidence(sourceHost, htmlText);
    if (canonicalEvidence) {
        evidence.push(canonicalEvidence);
    }

    const migrationEvidence = detectMigrationTextEvidence(sourceHost, htmlText);
    if (migrationEvidence) {
        evidence.push(migrationEvidence);
    }

    return evidence;
}

function classify({ evidence, attempts }) {
    const hasStrongCf = evidence.some((item) => item.strength === 'strong' && (item.type === 'cf_ray_header' || item.type === 'cloudflare_challenge_page'));
    const hasStrongRedirect = evidence.some((item) => item.strength === 'strong' && (
        item.type === 'http_301_302_host_changed' ||
        item.type === 'meta_refresh_cross_domain' ||
        item.type === 'canonical_link_cross_domain' ||
        item.type === 'migration_text_with_url'
    ));

    const hasSuccess = attempts.some((attempt) => !attempt.error && attempt.httpStatus > 0 && attempt.httpStatus < 400);
    const hasFailure = attempts.some((attempt) => attempt.error || attempt.httpStatus >= 400 || attempt.httpStatus === 0);
    const stableError = !hasSuccess && hasFailure;

    if (hasStrongCf && hasStrongRedirect) {
        return {
            state: 'uncertain',
            confidence: 'medium',
            extraEvidence: [{ type: 'conflicting_strong_evidence', strength: 'medium', details: {} }]
        };
    }

    if (hasStrongCf) {
        return {
            state: 'cloudflare',
            confidence: 'high',
            extraEvidence: []
        };
    }

    if (hasStrongRedirect) {
        return {
            state: 'redirected',
            confidence: 'high',
            extraEvidence: []
        };
    }

    if (hasSuccess && hasFailure) {
        return {
            state: 'uncertain',
            confidence: 'medium',
            extraEvidence: [{ type: 'intermittent_failures', strength: 'medium', details: {} }]
        };
    }

    if (stableError) {
        return {
            state: 'dead',
            confidence: 'high',
            extraEvidence: []
        };
    }

    return {
        state: 'ok',
        confidence: 'high',
        extraEvidence: []
    };
}

async function requestWithRedirectTrace(initialUrl, timeoutMs) {
    let currentUrl = initialUrl;
    const redirectChain = [];

    for (let i = 0; i < DEFAULT_MAX_REDIRECTS; i += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        let response;
        try {
            response = await fetch(currentUrl, {
                method: 'GET',
                redirect: 'manual',
                headers: {
                    'user-agent': 'vbook-tool-site-health/2.0'
                },
                signal: controller.signal
            });
        } finally {
            clearTimeout(timer);
        }

        const status = Number(response.status || 0);
        const location = response.headers.get('location');

        if ([301, 302, 303, 307, 308].includes(status) && location) {
            const nextUrl = new URL(location, currentUrl).toString();
            redirectChain.push({
                url: currentUrl,
                status,
                location: nextUrl
            });
            currentUrl = nextUrl;
            continue;
        }

        let htmlText = '';
        try {
            htmlText = await response.text();
        } catch {
            htmlText = '';
        }

        return {
            response,
            finalUrl: currentUrl,
            htmlText,
            redirectChain
        };
    }

    throw new Error('Too many redirects');
}

async function checkUrlWithRetry(url, options = {}) {
    const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
    const maxRetries = Number(options.maxRetries || DEFAULT_MAX_RETRIES);
    const startedAt = Date.now();

    const attempts = [];
    let firstError = null;
    let lastError = null;
    let finalResult = null;
    let workingUrl = url;

    for (let attemptIndex = 0; attemptIndex <= maxRetries; attemptIndex += 1) {
        const attemptStartedAt = Date.now();

        try {
            const requestResult = await requestWithRedirectTrace(workingUrl, timeoutMs);
            const httpStatus = Number(requestResult.response.status || 0);
            const evidence = collectEvidence(workingUrl, requestResult.response, requestResult.htmlText, requestResult.redirectChain, requestResult.finalUrl);

            attempts.push({
                attempt: attemptIndex + 1,
                checkedUrl: workingUrl,
                finalUrl: requestResult.finalUrl,
                httpStatus,
                durationMs: Date.now() - attemptStartedAt,
                redirectChain: requestResult.redirectChain,
                evidence,
                error: null
            });

            finalResult = requestResult;

            if (httpStatus < 400) {
                break;
            }

            lastError = `HTTP ${httpStatus}`;
            if (!firstError) {
                firstError = lastError;
            }
        } catch (error) {
            const message = String(error && error.message ? error.message : 'Unknown error');
            if (!firstError) {
                firstError = message;
            }
            lastError = message;

            attempts.push({
                attempt: attemptIndex + 1,
                checkedUrl: workingUrl,
                finalUrl: '',
                httpStatus: 0,
                durationMs: Date.now() - attemptStartedAt,
                redirectChain: [],
                evidence: [],
                error: message
            });

            if (isTlsError(error)) {
                workingUrl = toHttpUrl(workingUrl);
            }
        }

        if (attemptIndex < maxRetries) {
            const waitMs = 1000 * Math.pow(2, attemptIndex);
            await sleep(waitMs);
        }
    }

    const allEvidence = [];
    const seenEvidence = new Set();
    attempts.forEach((attempt) => {
        (attempt.evidence || []).forEach((item) => {
            const evidenceKey = `${item.type}:${JSON.stringify(item.details || {})}`;
            if (seenEvidence.has(evidenceKey)) {
                return;
            }

            seenEvidence.add(evidenceKey);
            allEvidence.push(item);
        });
    });

    const decision = classify({
        evidence: allEvidence,
        attempts
    });

    const sourceHost = normalizeHost(url);
    const finalUrl = finalResult && finalResult.finalUrl ? finalResult.finalUrl : '';
    const finalHost = normalizeHost(finalUrl);
    const latestAttempt = attempts[attempts.length - 1] || null;

    const evidence = allEvidence.concat(decision.extraEvidence || []);

    return {
        url,
        normalizedUrl: normalizeSiteUrlKey(url),
        sourceHost,
        finalHost,
        finalUrl,
        state: decision.state,
        confidence: decision.confidence,
        evidence,
        httpStatus: latestAttempt ? latestAttempt.httpStatus : 0,
        redirectChain: latestAttempt ? latestAttempt.redirectChain : [],
        checkedAt: new Date().toISOString(),
        checkDurationMs: Date.now() - startedAt,
        retriesAttempted: Math.max(0, attempts.length - 1),
        firstError,
        lastError,
        note: null,
        overriddenBy: null
    };
}

function readHealthOverrides(workspaceRoot) {
    const overridePath = path.join(workspaceRoot, 'references', 'site-health-overrides.json');
    const raw = safeReadJson(overridePath);
    if (!raw || typeof raw !== 'object') {
        return { byUrl: {}, byHost: {} };
    }

    const byUrl = {};
    const byHost = {};

    const byUrlRaw = raw.byUrl && typeof raw.byUrl === 'object' ? raw.byUrl : {};
    Object.keys(byUrlRaw).forEach((key) => {
        const normalizedKey = normalizeSiteUrlKey(key);
        if (normalizedKey) {
            byUrl[normalizedKey] = byUrlRaw[key];
        }
    });

    const byHostRaw = raw.byHost && typeof raw.byHost === 'object' ? raw.byHost : {};
    Object.keys(byHostRaw).forEach((key) => {
        const normalizedKey = normalizeHost(key);
        if (normalizedKey) {
            byHost[normalizedKey] = byHostRaw[key];
        }
    });

    return { byUrl, byHost };
}

function applyOverride(result, override, overrideKey) {
    if (!override || typeof override !== 'object') {
        return result;
    }

    const patched = { ...result };
    const state = String(override.state || '').trim().toLowerCase();
    if (['ok', 'dead', 'cloudflare', 'redirected', 'uncertain'].includes(state)) {
        patched.state = state;
    }

    const confidence = String(override.confidence || '').trim().toLowerCase();
    if (['high', 'medium', 'low'].includes(confidence)) {
        patched.confidence = confidence;
    }

    if (override.finalUrl) {
        patched.finalUrl = String(override.finalUrl);
        patched.finalHost = normalizeHost(patched.finalUrl);
    }

    if (override.note) {
        patched.note = String(override.note);
    }

    patched.overriddenBy = overrideKey;
    return patched;
}

function loadPreviousHealth(workspaceRoot) {
    const previousPath = path.join(workspaceRoot, 'web', 'site-health.json');
    const previous = safeReadJson(previousPath);
    if (!previous || typeof previous !== 'object' || !previous.byUrl || typeof previous.byUrl !== 'object') {
        return {};
    }

    return previous.byUrl;
}

async function runWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;

    async function consume() {
        while (cursor < items.length) {
            const currentIndex = cursor;
            cursor += 1;
            results[currentIndex] = await worker(items[currentIndex], currentIndex);
        }
    }

    const workers = [];
    const workerCount = Math.max(1, Math.min(limit, items.length || 1));
    for (let i = 0; i < workerCount; i += 1) {
        workers.push(consume());
    }

    await Promise.all(workers);
    return results;
}

function collectUrlsByScope(workspaceRoot, scope) {
    const normalizedScope = String(scope || 'web').trim().toLowerCase();
    const includeWeb = normalizedScope === 'web' || normalizedScope === 'all';
    const includeRealtime = normalizedScope === 'realtime' || normalizedScope === 'all';

    if (!includeWeb && !includeRealtime) {
        throw new Error('Invalid health source scope. Use: web, realtime, all');
    }

    const rawUrls = [];

    if (includeWeb) {
        const pluginPath = path.join(workspaceRoot, 'web', 'plugin.json');
        const pluginData = safeReadJson(pluginPath);
        if (!pluginData || !Array.isArray(pluginData.data)) {
            throw new Error('web/plugin.json is missing or invalid');
        }

        pluginData.data.forEach((item) => {
            const source = String(item && item.source ? item.source : '').trim();
            if (source) {
                rawUrls.push(source);
            }
        });
    }

    if (includeRealtime) {
        const remoteSourcesPath = path.join(workspaceRoot, 'references', 'remote-sources.json');
        const remoteSourcesData = safeReadJson(remoteSourcesPath);
        if (!remoteSourcesData || !Array.isArray(remoteSourcesData.sources)) {
            throw new Error('references/remote-sources.json is missing or invalid');
        }

        remoteSourcesData.sources.forEach((source) => {
            const url = String(source && source.url ? source.url : '').trim();
            if (url) {
                rawUrls.push(url);
            }
        });
    }

    return Array.from(new Set(rawUrls.filter((value) => /^https?:\/\//i.test(value))));
}

async function buildSiteHealth(workspaceRoot, options = {}) {
    const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
    const concurrency = Number(options.concurrency || DEFAULT_CONCURRENCY);
    const maxRetries = Number(options.maxRetries || DEFAULT_MAX_RETRIES);
    const sourceScope = String(options.source || 'web').trim().toLowerCase();

    const overrides = readHealthOverrides(workspaceRoot);
    const previousHealth = loadPreviousHealth(workspaceRoot);
    const uniqueSourceUrls = collectUrlsByScope(workspaceRoot, sourceScope);

    const checkedItems = await runWithConcurrency(uniqueSourceUrls, concurrency, async (url) => {
        const checked = await checkUrlWithRetry(url, {
            timeoutMs,
            maxRetries
        });

        const overrideByUrl = overrides.byUrl[checked.normalizedUrl];
        if (overrideByUrl) {
            return applyOverride(checked, overrideByUrl, `byUrl:${checked.normalizedUrl}`);
        }

        const overrideByHost = overrides.byHost[checked.sourceHost];
        if (overrideByHost) {
            return applyOverride(checked, overrideByHost, `byHost:${checked.sourceHost}`);
        }

        const previous = previousHealth[checked.normalizedUrl] || null;
        if (previous && previous.state === 'ok' && checked.state === 'dead') {
            checked.evidence = Array.isArray(checked.evidence) ? checked.evidence : [];
            checked.evidence.push({
                type: 'regression_from_ok',
                strength: 'low',
                details: {
                    previousState: previous.state,
                    previousCheckedAt: previous.checkedAt || null
                }
            });
        }

        return checked;
    });

    const stats = {
        ok: 0,
        redirected: 0,
        cloudflare: 0,
        dead: 0,
        uncertain: 0
    };

    const byUrl = {};

    checkedItems.forEach((item) => {
        if (stats[item.state] === undefined) {
            stats.uncertain += 1;
        } else {
            stats[item.state] += 1;
        }

        if (item.normalizedUrl) {
            byUrl[item.normalizedUrl] = item;
        }
    });

    const metadata = {
        timestamp: new Date().toISOString(),
        totalChecked: checkedItems.length,
        stats
    };

    // Keep legacy fields for compatibility while migrating UI/consumers.
    const payload = {
        metadata,
        generatedAt: metadata.timestamp,
        source: sourceScope === 'web'
            ? 'web/plugin.json:data[].source'
            : (sourceScope === 'realtime'
                ? 'references/remote-sources.json:sources[].url'
                : 'web/plugin.json:data[].source + references/remote-sources.json:sources[].url'),
        sourceScope,
        summary: {
            total: checkedItems.length,
            ok: stats.ok,
            dead: stats.dead,
            cloudflare: stats.cloudflare,
            redirected: stats.redirected,
            uncertain: stats.uncertain
        },
        byUrl,
        items: checkedItems
    };

    const outputPath = path.join(workspaceRoot, 'web', 'site-health.json');
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    return {
        success: true,
        path: 'web/site-health.json',
        total: checkedItems.length,
        summary: payload.summary
    };
}

module.exports = {
    buildSiteHealth,
    collectUrlsByScope,
    normalizeSiteUrlKey,
    normalizeHost,
    isHostChange,
    checkUrlWithRetry
};
