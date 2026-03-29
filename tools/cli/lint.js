const fs = require('fs');
const path = require('path');

const REQUIRED_ROOT_FILES = ['plugin.json', 'icon.png'];
const REQUIRED_SRC_FILES_BY_TYPE = {
    novel: ['detail.js', 'toc.js', 'chap.js'],
    comic: ['detail.js', 'toc.js', 'chap.js'],
    chinese_novel: ['detail.js', 'toc.js', 'chap.js']
};
const REQUIRED_SCRIPT_KEYS_BY_TYPE = {
    novel: ['detail', 'toc', 'chap'],
    comic: ['detail', 'toc', 'chap'],
    chinese_novel: ['detail', 'toc', 'chap']
};
const ALLOWED_PLUGIN_TOP_LEVEL_KEYS = new Set(['metadata', 'script', 'config']);
const ALLOWED_TYPES = new Set(['novel', 'comic', 'chinese_novel', 'translate', 'tts']);
const ALLOWED_LOCALES = new Set(['vi_VN', 'zh_CN', 'en_US']);
const CONFIG_KEY_SCHEMA = {
    thread_num: { types: ['number'], integer: true, min: 1 },
    delay: { types: ['number'], integer: true, min: 0 },
    preload_size: { types: ['number'], integer: true, min: 0 },
    max_length: { types: ['number'], integer: true, min: 1 },
    required_api_key: { types: ['boolean'] },
    support_auto_detect: { types: ['boolean'] },
    support_url: { types: ['string'] },
    max_line: { types: ['number'], integer: true, min: 1 },
    api_url: { types: ['string', 'descriptor'] },
    content_path: { types: ['string', 'descriptor'] },
    api_keys: { types: ['descriptor'] }
};

function detectConfigValueType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    const primitiveType = typeof value;
    if (primitiveType === 'string' || primitiveType === 'number' || primitiveType === 'boolean') {
        return primitiveType;
    }
    if (primitiveType !== 'object') return primitiveType;

    const maybeDescriptor =
        Object.prototype.hasOwnProperty.call(value, 'title') ||
        Object.prototype.hasOwnProperty.call(value, 'mode') ||
        Object.prototype.hasOwnProperty.call(value, 'format') ||
        Object.prototype.hasOwnProperty.call(value, 'default');

    if (maybeDescriptor) {
        return 'descriptor';
    }

    return 'object';
}

function validateConfigDescriptor(configKey, value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return `config.${configKey} must be an object descriptor`;
    }

    if (
        Object.prototype.hasOwnProperty.call(value, 'mode') &&
        typeof value.mode !== 'string'
    ) {
        return `config.${configKey}.mode must be a string when present`;
    }

    if (
        Object.prototype.hasOwnProperty.call(value, 'format') &&
        typeof value.format !== 'string'
    ) {
        return `config.${configKey}.format must be a string when present`;
    }

    return null;
}

function validateConfigEntry(configKey, value, workspaceRoot, pluginJsonPath, issues) {
    const schema = CONFIG_KEY_SCHEMA[configKey];
    if (!schema) {
        return;
    }

    const valueType = detectConfigValueType(value);
    if (!schema.types.includes(valueType)) {
        issues.push(
            createIssue(
                'error',
                'config.value-type',
                `config.${configKey} has invalid type: ${valueType}; expected ${schema.types.join(' or ')}`,
                path.relative(workspaceRoot, pluginJsonPath)
            )
        );
        return;
    }

    if (valueType === 'descriptor') {
        const descriptorError = validateConfigDescriptor(configKey, value);
        if (descriptorError) {
            issues.push(
                createIssue(
                    'error',
                    'config.descriptor',
                    descriptorError,
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
            return;
        }
    }

    if (valueType === 'number') {
        if (!Number.isFinite(value)) {
            issues.push(
                createIssue(
                    'error',
                    'config.number-finite',
                    `config.${configKey} must be a finite number`,
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
            return;
        }

        if (schema.integer && !Number.isInteger(value)) {
            issues.push(
                createIssue(
                    'error',
                    'config.number-integer',
                    `config.${configKey} must be an integer`,
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
            return;
        }

        if (typeof schema.min === 'number' && value < schema.min) {
            issues.push(
                createIssue(
                    'error',
                    'config.number-range',
                    `config.${configKey} must be >= ${schema.min}`,
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        }
    }
}

function createIssue(severity, ruleId, message, file) {
    return { severity, ruleId, message, file };
}

function findPluginRoot(startDir) {
    let current = path.resolve(startDir);
    const { root } = path.parse(current);

    while (true) {
        if (fs.existsSync(path.join(current, 'plugin.json'))) {
            return current;
        }
        if (current === root) {
            return null;
        }
        current = path.dirname(current);
    }
}

function collectPluginRootsRecursively(rootDir) {
    const found = [];
    const stack = [rootDir];

    while (stack.length > 0) {
        const current = stack.pop();
        if (!fs.existsSync(current)) continue;

        const pluginJsonPath = path.join(current, 'plugin.json');
        if (fs.existsSync(pluginJsonPath)) {
            found.push(current);
            continue;
        }

        let entries = [];
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        } catch (error) {
            continue;
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            stack.push(path.join(current, entry.name));
        }
    }

    return found;
}

function discoverTargets(workspaceRoot, optionPluginPath, options = {}) {
    const scanReferences = Boolean(options.scanReferences);

    if (optionPluginPath) {
        const candidate = path.resolve(optionPluginPath);
        const pluginRoot = findPluginRoot(candidate);
        if (!pluginRoot) {
            throw new Error(`plugin.json not found from --plugin path: ${optionPluginPath}`);
        }
        return [pluginRoot];
    }

    if (scanReferences) {
        const refsRoot = path.join(workspaceRoot, 'references', 'repos');
        if (!fs.existsSync(refsRoot)) {
            throw new Error('references/repos directory not found in workspace root.');
        }
        return collectPluginRootsRecursively(refsRoot);
    }

    const extensionsDir = path.join(workspaceRoot, 'extensions');
    if (!fs.existsSync(extensionsDir)) {
        throw new Error('extensions directory not found in workspace root.');
    }

    return fs
        .readdirSync(extensionsDir)
        .map((name) => path.join(extensionsDir, name))
        .filter((absPath) => fs.existsSync(path.join(absPath, 'plugin.json')));
}

function loadCatalogIndex(workspaceRoot) {
    const rootPluginPath = path.join(workspaceRoot, 'plugin.json');
    if (!fs.existsSync(rootPluginPath)) {
        return {
            bySource: new Map(),
            byName: new Map()
        };
    }

    try {
        const rootPlugin = JSON.parse(fs.readFileSync(rootPluginPath, 'utf8'));
        const data = Array.isArray(rootPlugin.data) ? rootPlugin.data : [];
        const bySource = new Map();
        const byName = new Map();

        for (const item of data) {
            if (!item || typeof item !== 'object') continue;
            if (typeof item.source === 'string' && item.source.trim()) {
                bySource.set(item.source.trim(), item);
            }
            if (typeof item.name === 'string' && item.name.trim()) {
                byName.set(item.name.trim(), item);
            }
        }

        return { bySource, byName };
    } catch (error) {
        return {
            bySource: new Map(),
            byName: new Map()
        };
    }
}

function getExpectedAuthor(workspaceRoot) {
    const rootPluginPath = path.join(workspaceRoot, 'plugin.json');
    if (fs.existsSync(rootPluginPath)) {
        try {
            const rootPlugin = JSON.parse(fs.readFileSync(rootPluginPath, 'utf8'));
            if (
                rootPlugin &&
                rootPlugin.metadata &&
                typeof rootPlugin.metadata.author === 'string' &&
                rootPlugin.metadata.author.trim()
            ) {
                return rootPlugin.metadata.author.trim();
            }
        } catch (error) {
            // Ignore parse error and fallback to env default.
        }
    }

    return process.env.VBOOK_AUTHOR || 'kychi';
}

function resolveCatalogEntry(catalogIndex, metadata) {
    if (!metadata || typeof metadata !== 'object') {
        return null;
    }

    const source = typeof metadata.source === 'string' ? metadata.source.trim() : '';
    if (source && catalogIndex.bySource.has(source)) {
        return catalogIndex.bySource.get(source);
    }

    const name = typeof metadata.name === 'string' ? metadata.name.trim() : '';
    if (name && catalogIndex.byName.has(name)) {
        return catalogIndex.byName.get(name);
    }

    return null;
}

function addRhinoSyntaxIssues(srcDir, workspaceRoot, issues) {
    if (!fs.existsSync(srcDir)) return;

    let files = [];
    try {
        files = fs.readdirSync(srcDir).filter((name) => name.endsWith('.js'));
    } catch (error) {
        return;
    }

    const checks = [
        {
            ruleId: 'rhino.async-await',
            message: 'Rhino compatibility: avoid async/await syntax',
            regex: /\basync\b|\bawait\b/
        },
        {
            ruleId: 'rhino.import-export',
            message: 'Rhino compatibility: avoid ES module import/export syntax',
            regex: /^\s*(import|export)\b/m
        },
        {
            ruleId: 'rhino.optional-chaining',
            message: 'Rhino compatibility: avoid optional chaining (?.)',
            regex: /\?\./
        },
        {
            ruleId: 'rhino.nullish-coalescing',
            message: 'Rhino compatibility: avoid nullish coalescing (??)',
            regex: /\?\?/
        }
    ];

    for (const file of files) {
        const filePath = path.join(srcDir, file);
        let content = '';
        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            continue;
        }

        for (const check of checks) {
            if (check.regex.test(content)) {
                issues.push(
                    createIssue(
                        'error',
                        check.ruleId,
                        check.message,
                        path.relative(workspaceRoot, filePath)
                    )
                );
            }
        }
    }
}

function validateExtension(targetRoot, workspaceRoot, catalogIndex, expectedAuthor, options = {}) {
    const includeNoiseWarnings = Boolean(options.includeNoiseWarnings);
    const enableProjectSpecificWarnings = Boolean(options.enableProjectSpecificWarnings);
    const enableRhinoChecks = Boolean(options.enableRhinoChecks);

    const issues = [];
    const pluginJsonPath = path.join(targetRoot, 'plugin.json');
    const srcDir = path.join(targetRoot, 'src');

    for (const requiredFile of REQUIRED_ROOT_FILES) {
        const absPath = path.join(targetRoot, requiredFile);
        if (!fs.existsSync(absPath)) {
            issues.push(
                createIssue(
                    'error',
                    'root.required-file',
                    `Missing required file: ${requiredFile}`,
                    path.relative(workspaceRoot, absPath)
                )
            );
        }
    }

    if (includeNoiseWarnings) {
        const pluginZipPath = path.join(targetRoot, 'plugin.zip');
        if (fs.existsSync(pluginZipPath)) {
            issues.push(
                createIssue(
                    'warning',
                    'noise.plugin-zip',
                    'plugin.zip exists in source tree (artifact file should usually be ignored)',
                    path.relative(workspaceRoot, pluginZipPath)
                )
            );
        }

        const srcTestJsonPath = path.join(srcDir, 'test.json');
        if (fs.existsSync(srcTestJsonPath)) {
            issues.push(
                createIssue(
                    'warning',
                    'noise.test-json',
                    'src/test.json exists (dev fixture/noise in many repos)',
                    path.relative(workspaceRoot, srcTestJsonPath)
                )
            );
        }
    }

    let pluginData;
    try {
        pluginData = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    } catch (error) {
        issues.push(
            createIssue(
                'error',
                'plugin.json.parse',
                `Invalid plugin.json: ${error.message}`,
                path.relative(workspaceRoot, pluginJsonPath)
            )
        );
        return issues;
    }

    if (pluginData && typeof pluginData === 'object' && !Array.isArray(pluginData)) {
        const topLevelKeys = Object.keys(pluginData);
        for (const key of topLevelKeys) {
            if (!ALLOWED_PLUGIN_TOP_LEVEL_KEYS.has(key) && enableProjectSpecificWarnings) {
                issues.push(
                    createIssue(
                        'warning',
                        'plugin.top-level-key',
                        `Unexpected top-level key in plugin.json: ${key}`,
                        path.relative(workspaceRoot, pluginJsonPath)
                    )
                );
            }
        }
    }

    const metadata = pluginData && pluginData.metadata;
    const script = pluginData && pluginData.script;
    const config = pluginData && pluginData.config;
    const metadataType =
        metadata && typeof metadata.type === 'string' ? metadata.type.trim() : '';

    const requiredSrcFiles = REQUIRED_SRC_FILES_BY_TYPE[metadataType] || [];
    for (const requiredFile of requiredSrcFiles) {
        const absPath = path.join(srcDir, requiredFile);
        if (!fs.existsSync(absPath)) {
            issues.push(
                createIssue(
                    'error',
                    'src.required-file',
                    `Missing required source file: src/${requiredFile}`,
                    path.relative(workspaceRoot, absPath)
                )
            );
        }
    }

    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        issues.push(
            createIssue(
                'error',
                'metadata.required',
                'metadata must be a JSON object',
                path.relative(workspaceRoot, pluginJsonPath)
            )
        );
    }

    if (!script || typeof script !== 'object' || Array.isArray(script)) {
        issues.push(
            createIssue(
                'error',
                'script.required',
                'script must be a JSON object',
                path.relative(workspaceRoot, pluginJsonPath)
            )
        );
    }

    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
        const version = metadata.version;
        if (!Number.isInteger(version) || version < 1) {
            issues.push(
                createIssue(
                    'error',
                    'metadata.version',
                    'metadata.version must be an integer >= 1',
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        }

        const type = metadata.type;
        if (typeof type !== 'string' || !ALLOWED_TYPES.has(type)) {
            issues.push(
                createIssue(
                    'error',
                    'metadata.type',
                    `metadata.type must be one of: ${Array.from(ALLOWED_TYPES).join(', ')}`,
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        }

        const locale = metadata.locale;
        if (
            Object.prototype.hasOwnProperty.call(metadata, 'local') &&
            !Object.prototype.hasOwnProperty.call(metadata, 'locale')
        ) {
            issues.push(
                createIssue(
                    'warning',
                    'metadata.locale-key',
                    'Found metadata.local; expected metadata.locale',
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        }

        if (typeof locale === 'string' && locale.includes('-')) {
            issues.push(
                createIssue(
                    'warning',
                    'metadata.locale-format',
                    `metadata.locale should use underscore format (e.g. vi_VN), got: ${locale}`,
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        }

        if (typeof locale !== 'string' || !ALLOWED_LOCALES.has(locale)) {
            issues.push(
                createIssue(
                    'warning',
                    'metadata.locale',
                    `metadata.locale should be one of: ${Array.from(ALLOWED_LOCALES).join(', ')}`,
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        }

        if (typeof metadata.regexp !== 'string' || !metadata.regexp.trim()) {
            issues.push(
                createIssue(
                    'error',
                    'metadata.regexp',
                    'metadata.regexp must be a non-empty string',
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        } else {
            try {
                const compiledRegexp = new RegExp(metadata.regexp);
                const typeNeedsStrictDetailRegexp = ['novel', 'comic', 'chinese_novel'].includes(
                    String(metadata.type || '')
                );
                const looksAnchored = /\$\s*$/.test(metadata.regexp.trim());
                if (enableProjectSpecificWarnings && typeNeedsStrictDetailRegexp && !looksAnchored) {
                    issues.push(
                        createIssue(
                            'warning',
                            'metadata.regexp-anchor',
                            'metadata.regexp should usually end with an anchor ($) for detail page matching',
                            path.relative(workspaceRoot, pluginJsonPath)
                        )
                    );
                }

                const source = typeof metadata.source === 'string' ? metadata.source : '';
                if (source) {
                    if (enableProjectSpecificWarnings) {
                        let sourceHost = '';
                        try {
                            sourceHost = new URL(source).hostname;
                        } catch (error) {
                            sourceHost = '';
                        }

                        if (sourceHost) {
                            const rawHostHit = metadata.regexp.includes(sourceHost);
                            const escapedHost = sourceHost.replace(/\./g, '\\.');
                            const escapedHostHit = metadata.regexp.includes(escapedHost);
                            if (!rawHostHit && !escapedHostHit) {
                                issues.push(
                                    createIssue(
                                        'warning',
                                        'metadata.regexp-sanity',
                                        'metadata.regexp does not seem to include source hostname; verify detail URL matching',
                                        path.relative(workspaceRoot, pluginJsonPath)
                                    )
                                );
                            }
                        }
                    }
                }
            } catch (error) {
                issues.push(
                    createIssue(
                        'error',
                        'metadata.regexp-parse',
                        `metadata.regexp is not a valid JavaScript regexp: ${error.message}`,
                        path.relative(workspaceRoot, pluginJsonPath)
                    )
                );
            }
        }

        if (
            enableProjectSpecificWarnings &&
            expectedAuthor &&
            (typeof metadata.author !== 'string' || metadata.author.trim() !== expectedAuthor)
        ) {
            issues.push(
                createIssue(
                    'warning',
                    'metadata.author',
                    `metadata.author should be "${expectedAuthor}"`,
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        }

        const catalogEntry = resolveCatalogEntry(catalogIndex, metadata);
        if (
            enableProjectSpecificWarnings &&
            catalogEntry &&
            Number.isInteger(metadata.version) &&
            Number.isInteger(catalogEntry.version) &&
            metadata.version !== catalogEntry.version
        ) {
            issues.push(
                createIssue(
                    'warning',
                    'catalog.version-sync',
                    `Version mismatch with root catalog: extension=${metadata.version}, catalog=${catalogEntry.version}`,
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        }
    }

    if (script && typeof script === 'object' && !Array.isArray(script)) {
        const requiredScriptKeys = REQUIRED_SCRIPT_KEYS_BY_TYPE[metadataType] || [];
        for (const requiredKey of requiredScriptKeys) {
            if (!Object.prototype.hasOwnProperty.call(script, requiredKey)) {
                issues.push(
                    createIssue(
                        'error',
                        'script.required-entry',
                        `script.${requiredKey} is required`,
                        path.relative(workspaceRoot, pluginJsonPath)
                    )
                );
            }
        }

        for (const [key, value] of Object.entries(script)) {
            if (typeof value !== 'string' || !value.trim()) {
                issues.push(
                    createIssue(
                        'error',
                        'script.entry-type',
                        `script.${key} must be a non-empty string filename`,
                        path.relative(workspaceRoot, pluginJsonPath)
                    )
                );
                continue;
            }

            const filename = value.trim();
            const hasPathSeparator = filename.includes('/') || filename.includes('\\');
            if (hasPathSeparator || path.basename(filename) !== filename) {
                issues.push(
                    createIssue(
                        'error',
                        'script.filename-only',
                        `script.${key} must be filename only (e.g. home.js), got: ${filename}`,
                        path.relative(workspaceRoot, pluginJsonPath)
                    )
                );
                continue;
            }

            const scriptPath = path.join(srcDir, filename);
            if (!fs.existsSync(scriptPath)) {
                issues.push(
                    createIssue(
                        'error',
                        'script.file-exists',
                        `script.${key} points to missing file: src/${filename}`,
                        path.relative(workspaceRoot, scriptPath)
                    )
                );
            }
        }
    }

    if (config !== undefined) {
        if (!config || typeof config !== 'object' || Array.isArray(config)) {
            issues.push(
                createIssue(
                    'error',
                    'config.required-object',
                    'config must be a JSON object when present',
                    path.relative(workspaceRoot, pluginJsonPath)
                )
            );
        } else {
            for (const [configKey, configValue] of Object.entries(config)) {
                if (!Object.prototype.hasOwnProperty.call(CONFIG_KEY_SCHEMA, configKey)) {
                    if (enableProjectSpecificWarnings) {
                        issues.push(
                            createIssue(
                                'warning',
                                'config.unknown-key',
                                `Unknown config key: ${configKey}`,
                                path.relative(workspaceRoot, pluginJsonPath)
                            )
                        );
                    }
                    continue;
                }

                validateConfigEntry(configKey, configValue, workspaceRoot, pluginJsonPath, issues);
            }
        }
    }

    if (enableRhinoChecks) {
        addRhinoSyntaxIssues(srcDir, workspaceRoot, issues);
    }

    return issues;
}

function buildSummary(results, startedAtMs) {
    let errorCount = 0;
    let warningCount = 0;

    for (const item of results) {
        for (const issue of item.issues) {
            if (issue.severity === 'error') errorCount += 1;
            if (issue.severity === 'warning') warningCount += 1;
        }
    }

    return {
        counts: {
            targets: results.length,
            error: errorCount,
            warning: warningCount
        },
        durationMs: Date.now() - startedAtMs
    };
}

function runLint(workspaceRoot, optionPluginPath, options = {}) {
    const startedAtMs = Date.now();
    const targets = discoverTargets(workspaceRoot, optionPluginPath, options);
    const catalogIndex = loadCatalogIndex(workspaceRoot);
    const expectedAuthor = getExpectedAuthor(workspaceRoot);
    const scope = options.scanReferences ? 'references' : 'extensions';
    const includeNoiseWarnings = options.includeNoiseWarnings !== undefined
        ? Boolean(options.includeNoiseWarnings)
        : Boolean(options.scanReferences);
    const enableProjectSpecificWarnings = options.enableProjectSpecificWarnings !== undefined
        ? Boolean(options.enableProjectSpecificWarnings)
        : !Boolean(options.scanReferences);
    const enableRhinoChecks = Boolean(options.enableRhinoChecks);

    const results = targets.map((targetRoot) => {
        const issues = validateExtension(targetRoot, workspaceRoot, catalogIndex, expectedAuthor, {
            includeNoiseWarnings,
            enableProjectSpecificWarnings,
            enableRhinoChecks
        });
        return {
            name: path.basename(targetRoot),
            root: path.relative(workspaceRoot, targetRoot),
            issues
        };
    });

    const summary = buildSummary(results, startedAtMs);

    return {
        summary,
        scope,
        expectedAuthor,
        profile: {
            includeNoiseWarnings,
            enableProjectSpecificWarnings,
            enableRhinoChecks
        },
        scannedTargets: results.map((item) => item.root),
        results
    };
}

function formatIssueRows(results) {
    const rows = [];
    for (const extension of results) {
        if (!extension.issues.length) continue;
        for (const issue of extension.issues) {
            rows.push({
                extension: extension.name,
                severity: issue.severity.toUpperCase(),
                rule: issue.ruleId,
                file: issue.file,
                message: issue.message
            });
        }
    }
    return rows;
}

function printLintTableReport(report) {
    const rows = formatIssueRows(report.results);

    console.log('');
    console.log('VBook Lint Report');
    console.log('=================');

    if (!rows.length) {
        console.log('No issues found.');
    } else {
        const colWidths = {
            extension: Math.max('Extension'.length, ...rows.map((row) => row.extension.length)),
            severity: Math.max('Severity'.length, ...rows.map((row) => row.severity.length)),
            rule: Math.max('Rule'.length, ...rows.map((row) => row.rule.length)),
            file: Math.max('File'.length, ...rows.map((row) => row.file.length))
        };

        const header = [
            'Extension'.padEnd(colWidths.extension),
            'Severity'.padEnd(colWidths.severity),
            'Rule'.padEnd(colWidths.rule),
            'File'.padEnd(colWidths.file),
            'Message'
        ].join(' | ');

        console.log(header);
        console.log('-'.repeat(header.length));

        for (const row of rows) {
            console.log(
                [
                    row.extension.padEnd(colWidths.extension),
                    row.severity.padEnd(colWidths.severity),
                    row.rule.padEnd(colWidths.rule),
                    row.file.padEnd(colWidths.file),
                    row.message
                ].join(' | ')
            );
        }
    }

    console.log('');
    console.log(
        `Scanned: ${report.summary.counts.targets} extension(s) | ` +
            `Errors: ${report.summary.counts.error} | ` +
            `Warnings: ${report.summary.counts.warning} | ` +
            `Duration: ${report.summary.durationMs}ms`
    );
}

module.exports = {
    runLint,
    printLintTableReport
};