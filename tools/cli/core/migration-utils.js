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

function isSampleExtension(pluginJsonPath) {
    try {
        const parsed = readJson(pluginJsonPath);
        const metadata = parsed && typeof parsed === 'object' ? parsed.metadata || {} : {};
        const folder = path.basename(path.dirname(pluginJsonPath)).toLowerCase();

        if (folder === 'example' || folder === 'template' || folder === 'vbook-ext-template') {
            return true;
        }

        const name = typeof metadata.name === 'string' ? metadata.name.toLowerCase() : '';
        const source = typeof metadata.source === 'string' ? metadata.source.toLowerCase() : '';
        const regexp = typeof metadata.regexp === 'string' ? metadata.regexp : '';

        // Exclude scaffold/example placeholders from all catalogs/reports.
        if (name.includes('template')) return true;
        if (source.includes('example.com')) return true;
        if (regexp.includes('<') || regexp.includes('>')) return true;

        return false;
    } catch (error) {
        return false;
    }
}

function normalizeType(type, metadata = {}, script = {}) {
    if (typeof type === 'string') {
        const value = type.trim().toLowerCase();
        if (VALID_TYPES.includes(value)) return value;
        if (value === 'text' || value === 'novel_text' || value === 'text_novel') return 'novel';
    }

    const locale = typeof metadata.locale === 'string' ? metadata.locale.trim().toLowerCase() : '';
    if (locale === 'zh_cn') return 'chinese_novel';

    const signals = [
        typeof metadata.name === 'string' ? metadata.name : '',
        typeof metadata.description === 'string' ? metadata.description : '',
        typeof metadata.regexp === 'string' ? metadata.regexp : '',
        typeof metadata.source === 'string' ? metadata.source : ''
    ].join(' ').toLowerCase();

    if (/manga|manhwa|manhua|comic|truyen-tranh|truyện-tranh/.test(signals)) {
        return 'comic';
    }

    if (script && typeof script === 'object' && !Array.isArray(script)) {
        const scriptKeys = Object.keys(script).join(' ').toLowerCase();
        if (/manga|comic/.test(scriptKeys)) return 'comic';
    }

    return 'novel';
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
    if (domain) {
        const author = normalizeName(metadata && metadata.author) || '_unknown';
        return `domain:${domain}|author:${author}`;
    }

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

        if (hasPluginJson && isExtensionPluginJson(pluginJsonPath) && !isSampleExtension(pluginJsonPath)) {
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
