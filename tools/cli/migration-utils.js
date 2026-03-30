const fs = require('fs');
const path = require('path');

const VALID_TYPES = ['novel', 'comic', 'chinese_novel', 'translate', 'tts'];

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function isExtensionPluginJson(pluginJsonPath) {
    try {
        const parsed = readJson(pluginJsonPath);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
        const metadata = parsed.metadata;
        const script = parsed.script;
        return Boolean(
            metadata && typeof metadata === 'object' && !Array.isArray(metadata) &&
            script && typeof script === 'object' && !Array.isArray(script)
        );
    } catch (error) {
        // Keep invalid plugin.json directories in scope so lint/fix can report/fix them.
        return true;
    }
}

function normalizeType(type) {
    if (typeof type !== 'string') return '_unknown';
    const value = type.trim().toLowerCase();
    return VALID_TYPES.includes(value) ? value : '_unknown';
}

function normalizeName(name) {
    if (typeof name !== 'string') return '';
    return name.trim().toLowerCase();
}

function normalizeLocale(locale) {
    if (typeof locale !== 'string') return null;
    const value = locale.trim();
    return value || null;
}

function parseVersion(version) {
    if (typeof version === 'number' && Number.isInteger(version)) return version;
    if (typeof version === 'string' && /^\d+$/.test(version.trim())) {
        return parseInt(version.trim(), 10);
    }
    return 0;
}

function toPosixPath(filePath) {
    return filePath.split(path.sep).join('/');
}

function tryGetSourceDomain(source) {
    if (typeof source !== 'string' || !source.trim()) return null;
    try {
        const url = new URL(source.trim());
        return url.hostname.toLowerCase().replace(/^www\./, '');
    } catch (error) {
        return null;
    }
}

function getDedupeKey(metadata) {
    const domain = tryGetSourceDomain(metadata && metadata.source);
    if (domain) return `domain:${domain}`;

    const name = normalizeName(metadata && metadata.name);
    if (name) return `name:${name}`;

    return null;
}

function classifyRepoSource(relativePluginRoot) {
    const normalized = toPosixPath(relativePluginRoot).toLowerCase();

    if (normalized.startsWith('extensions/')) return 'extensions';
    if (normalized.includes('/darkrai9x-vbook-extensions/')) return 'darkrai9x';
    if (normalized.includes('/dat-bi-ext-vbook/')) return 'dat-bi';
    return 'others';
}

function repoPriority(repoSource) {
    if (repoSource === 'extensions') return 4;
    if (repoSource === 'darkrai9x') return 3;
    if (repoSource === 'dat-bi') return 2;
    return 1;
}

function resolveReportsDir(workspaceRoot) {
    return path.join(workspaceRoot, 'tools', 'cli', 'reports');
}

function resolveInventoryPath(workspaceRoot, optionPath) {
    if (optionPath) return path.resolve(optionPath);
    return path.join(resolveReportsDir(workspaceRoot), 'inventory.json');
}

function resolveFixReportPath(workspaceRoot, optionPath) {
    if (optionPath) return path.resolve(optionPath);
    return path.join(resolveReportsDir(workspaceRoot), 'fix-report.json');
}

function collectPluginRootsRecursively(baseDir, collector) {
    if (!fs.existsSync(baseDir)) return;

    const stack = [baseDir];
    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        const hasPluginJson = entries.some((entry) => entry.isFile() && entry.name === 'plugin.json');
        const pluginJsonPath = path.join(current, 'plugin.json');

        if (hasPluginJson && isExtensionPluginJson(pluginJsonPath)) {
            collector.push(current);
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            stack.push(path.join(current, entry.name));
        }
    }
}

function discoverAllPluginRoots(workspaceRoot) {
    const roots = [];

    const extensionsDir = path.join(workspaceRoot, 'extensions');
    if (fs.existsSync(extensionsDir)) {
        const skipBuckets = new Set([...VALID_TYPES, '_unknown']);
        const topEntries = fs.readdirSync(extensionsDir, { withFileTypes: true });
        for (const entry of topEntries) {
            if (!entry.isDirectory()) continue;
            if (skipBuckets.has(entry.name)) continue;
            collectPluginRootsRecursively(path.join(extensionsDir, entry.name), roots);
        }
    }

    collectPluginRootsRecursively(path.join(workspaceRoot, 'references', 'repos'), roots);

    roots.sort((a, b) => a.localeCompare(b));
    return roots;
}

function relativeFromWorkspace(workspaceRoot, absolutePath) {
    return toPosixPath(path.relative(workspaceRoot, absolutePath));
}

function compareCandidates(a, b) {
    const repoDelta = repoPriority(b.repoSource) - repoPriority(a.repoSource);
    if (repoDelta !== 0) return repoDelta;

    if (a.version !== b.version) return b.version - a.version;

    return a.relativeRoot.localeCompare(b.relativeRoot);
}

module.exports = {
    VALID_TYPES,
    collectPluginRootsRecursively,
    compareCandidates,
    classifyRepoSource,
    discoverAllPluginRoots,
    getDedupeKey,
    normalizeLocale,
    normalizeType,
    parseVersion,
    readJson,
    relativeFromWorkspace,
    resolveFixReportPath,
    resolveInventoryPath,
    resolveReportsDir,
    tryGetSourceDomain,
    writeJson
};
