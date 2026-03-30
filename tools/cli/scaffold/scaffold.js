const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { runLint } = require('../lint/lint');

const ALLOWED_TYPES = ['novel', 'comic', 'chinese_novel', 'translate', 'tts'];
const ALLOWED_LOCALES = ['vi_VN', 'zh_CN', 'en_US'];

function slugifyName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function ensureUrl(input) {
    const value = String(input || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
}

function escapeRegexHost(hostname) {
    return hostname.replace(/\./g, '\\.');
}

function buildDefaultRegexp(sourceUrl) {
    try {
        const hostname = new URL(sourceUrl).hostname;
        const escaped = escapeRegexHost(hostname);
        return `${escaped}/[^/]+/?$`;
    } catch (error) {
        return 'example\\.com/novel/[^/]+/?$';
    }
}

function copyDirRecursive(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function askIfMissing(config, key, prompt, fallback = '') {
    if (config[key]) return;
    if (!process.stdin.isTTY) {
        throw new Error(`Missing required option --${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`);
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answer = await rl.question(`${prompt}${fallback ? ` (${fallback})` : ''}: `);
        config[key] = (answer || fallback || '').trim();
    } finally {
        rl.close();
    }
}

function parseAndNormalizeOptions(workspaceRoot, options = {}) {
    const source = ensureUrl(options.source);
    const name = String(options.name || '').trim();
    const folderName = options.folder
        ? slugifyName(options.folder)
        : slugifyName(name);

    const templateDir = path.resolve(
        options.template || path.join(workspaceRoot, 'extensions', 'vbook-ext-template')
    );

    const outputDir = path.resolve(
        options.output || path.join(workspaceRoot, 'extensions', folderName)
    );

    const type = String(options.type || 'novel').trim();
    const locale = String(options.locale || 'vi_VN').trim();
    const author = String(options.author || process.env.VBOOK_AUTHOR || 'kychi').trim();
    const description = String(options.description || `Generated extension for ${source}`).trim();
    const regexp = String(options.regexp || buildDefaultRegexp(source)).trim();

    if (!name) throw new Error('Extension name is required.');
    if (!source) throw new Error('Source URL is required.');
    if (!folderName) throw new Error('Unable to build target folder name from extension name.');
    if (!ALLOWED_TYPES.includes(type)) {
        throw new Error(`Unsupported type: ${type}. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }
    if (!ALLOWED_LOCALES.includes(locale)) {
        throw new Error(`Unsupported locale: ${locale}. Allowed: ${ALLOWED_LOCALES.join(', ')}`);
    }

    return {
        name,
        folderName,
        source,
        type,
        locale,
        author,
        description,
        regexp,
        templateDir,
        outputDir,
        dryRun: Boolean(options.dryRun),
        force: Boolean(options.force),
        skipLint: Boolean(options.skipLint)
    };
}

function updateGeneratedPluginJson(config, outputDir) {
    const pluginPath = path.join(outputDir, 'plugin.json');
    if (!fs.existsSync(pluginPath)) {
        throw new Error('Template plugin.json not found after scaffold copy.');
    }

    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
    plugin.metadata = plugin.metadata || {};
    plugin.script = plugin.script || {};

    plugin.metadata.name = config.name;
    plugin.metadata.author = config.author;
    plugin.metadata.version = 1;
    plugin.metadata.source = config.source;
    plugin.metadata.regexp = config.regexp;
    plugin.metadata.description = config.description;
    plugin.metadata.locale = config.locale;
    plugin.metadata.language = 'javascript';
    plugin.metadata.type = config.type;

    fs.writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`, 'utf8');
}

function scaffoldExtension(workspaceRoot, options = {}) {
    const config = parseAndNormalizeOptions(workspaceRoot, options);

    if (!fs.existsSync(config.templateDir)) {
        throw new Error(`Template directory not found: ${config.templateDir}`);
    }

    if (fs.existsSync(config.outputDir) && !config.force) {
        throw new Error(`Output directory already exists: ${config.outputDir} (use --force to overwrite)`);
    }

    const planned = {
        name: config.name,
        outputDir: path.relative(workspaceRoot, config.outputDir),
        templateDir: path.relative(workspaceRoot, config.templateDir),
        metadata: {
            source: config.source,
            type: config.type,
            locale: config.locale,
            author: config.author,
            regexp: config.regexp
        },
        dryRun: config.dryRun
    };

    if (config.dryRun) {
        return {
            success: true,
            generated: false,
            ...planned
        };
    }

    if (fs.existsSync(config.outputDir) && config.force) {
        fs.rmSync(config.outputDir, { recursive: true, force: true });
    }

    copyDirRecursive(config.templateDir, config.outputDir);
    updateGeneratedPluginJson(config, config.outputDir);

    let lintReport = null;
    if (!config.skipLint) {
        lintReport = runLint(workspaceRoot, config.outputDir, {
            scanReferences: false,
            enableRhinoChecks: true
        });

        if (lintReport.summary.counts.error > 0) {
            return {
                success: false,
                generated: true,
                ...planned,
                lintReport
            };
        }
    }

    return {
        success: true,
        generated: true,
        ...planned,
        lintReport
    };
}

module.exports = {
    scaffoldExtension,
    askIfMissing,
    ALLOWED_TYPES,
    ALLOWED_LOCALES
};
