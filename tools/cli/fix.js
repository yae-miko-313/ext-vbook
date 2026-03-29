const fs = require('fs');
const path = require('path');
const { runLint } = require('./lint');

function normalizeLocale(locale) {
    if (typeof locale !== 'string') return locale;
    const value = locale.trim().replace(/-/g, '_');
    const parts = value.split('_');
    if (parts.length !== 2) return value;
    const lang = parts[0].toLowerCase();
    const region = parts[1].toUpperCase();
    return `${lang}_${region}`;
}

function basenameOrSelf(value) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return path.basename(trimmed);
}

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function applySafeFixes(pluginJson, pluginSourceDir) {
    const changes = [];
    const plugin = { ...pluginJson };

    if (plugin.metadata && typeof plugin.metadata === 'object' && !Array.isArray(plugin.metadata)) {
        plugin.metadata = { ...plugin.metadata };

        if (typeof plugin.metadata.version === 'string' && /^\d+$/.test(plugin.metadata.version)) {
            const oldVer = plugin.metadata.version;
            const newVer = parseInt(oldVer, 10);
            plugin.metadata.version = newVer;
            changes.push({
                field: 'metadata.version',
                action: 'convert-type',
                from: `"${oldVer}"`,
                to: newVer
            });
        }

        if (typeof plugin.metadata.type === 'string') {
            const oldType = plugin.metadata.type;
            const newType = oldType.toLowerCase();
            if (oldType !== newType) {
                plugin.metadata.type = newType;
                changes.push({
                    field: 'metadata.type',
                    action: 'lowercase',
                    from: oldType,
                    to: newType
                });
            }
        }

        if (typeof plugin.metadata.regexp === 'string') {
            const regexp = plugin.metadata.regexp;
            if (regexp.trim() && !/\$\s*$/.test(regexp) && !/\[\^\/\]\+\/\?\$/.test(regexp)) {
                changes.push({
                    field: 'metadata.regexp',
                    action: 'propose-warn',
                    from: regexp,
                    to: 'Needs end anchor ($ or [^/]+/?$)'
                });
            }
        }

        if (!plugin.metadata.description || (typeof plugin.metadata.description === 'string' && !plugin.metadata.description.trim())) {
            changes.push({
                field: 'metadata.description',
                action: 'propose-warn',
                from: plugin.metadata.description || '""',
                to: 'Add a description'
            });
        }

        if (
            Object.prototype.hasOwnProperty.call(plugin.metadata, 'local') &&
            !Object.prototype.hasOwnProperty.call(plugin.metadata, 'locale')
        ) {
            plugin.metadata.locale = plugin.metadata.local;
            delete plugin.metadata.local;
            changes.push({
                field: 'metadata.locale',
                action: 'rename',
                from: 'metadata.local',
                value: plugin.metadata.locale
            });
        }

        if (typeof plugin.metadata.locale === 'string') {
            const original = plugin.metadata.locale;
            const normalized = normalizeLocale(original);
            if (normalized !== original) {
                plugin.metadata.locale = normalized;
                changes.push({
                    field: 'metadata.locale',
                    action: 'normalize-locale',
                    from: original,
                    to: normalized
                });
            }
        }
    }

    if (plugin.script && typeof plugin.script === 'object' && !Array.isArray(plugin.script)) {
        plugin.script = { ...plugin.script };
        for (const [key, value] of Object.entries(plugin.script)) {
            if (typeof value !== 'string') continue;
            const normalized = basenameOrSelf(value);
            if (normalized !== value) {
                plugin.script[key] = normalized;
                changes.push({
                    field: `script.${key}`,
                    action: 'basename',
                    from: value,
                    to: normalized
                });
            }

            if (pluginSourceDir) {
                const absPath = path.join(pluginSourceDir, 'src', normalized);
                if (!fs.existsSync(absPath)) {
                    changes.push({
                        field: `script.${key}`,
                        action: 'propose-warn',
                        from: normalized,
                        to: `File missing: src/${normalized}`
                    });
                }
            }
        }
    }

    return { plugin, changes };
}

function cleanupNoiseFiles(pluginRoot) {
    const cleanupResults = [];
    const candidates = [
        path.join(pluginRoot, 'plugin.zip'),
        path.join(pluginRoot, 'src', 'test.json')
    ];

    for (const filePath of candidates) {
        if (!fs.existsSync(filePath)) continue;
        fs.rmSync(filePath, { force: true });
        cleanupResults.push(filePath);
    }

    return cleanupResults;
}

function runFix(workspaceRoot, optionPluginPath, options = {}) {
    const scanReferences = Boolean(options.scanReferences);
    const enableRhinoChecks = Boolean(options.enableRhinoChecks);
    const write = Boolean(options.write);
    const cleanupNoise = Boolean(options.cleanupNoise);

    const beforeLint = runLint(workspaceRoot, optionPluginPath, {
        scanReferences,
        enableRhinoChecks
    });

    const targets = beforeLint.scannedTargets.map((relativeRoot) =>
        path.resolve(workspaceRoot, relativeRoot)
    );

    const results = [];
    let changedTargets = 0;
    let totalChanges = 0;

    for (const targetRoot of targets) {
        const pluginJsonPath = path.join(targetRoot, 'plugin.json');
        const relativePluginJsonPath = path.relative(workspaceRoot, pluginJsonPath);

        let pluginData;
        try {
            pluginData = loadJson(pluginJsonPath);
        } catch (error) {
            results.push({
                name: path.basename(targetRoot),
                root: path.relative(workspaceRoot, targetRoot),
                updated: false,
                changes: [],
                cleanup: [],
                error: `Cannot parse plugin.json: ${error.message}`
            });
            continue;
        }

        const fixed = applySafeFixes(pluginData, targetRoot);
        let cleanup = [];

        if (write) {
            if (fixed.changes.length > 0) {
                saveJson(pluginJsonPath, fixed.plugin);
            }
            if (cleanupNoise) {
                cleanup = cleanupNoiseFiles(targetRoot).map((filePath) => path.relative(workspaceRoot, filePath));
            }
        }

        if (fixed.changes.length > 0 || cleanup.length > 0) {
            changedTargets += 1;
        }
        totalChanges += fixed.changes.length;

        results.push({
            name: path.basename(targetRoot),
            root: path.relative(workspaceRoot, targetRoot),
            pluginJson: relativePluginJsonPath,
            updated: write && (fixed.changes.length > 0 || cleanup.length > 0),
            changes: fixed.changes,
            cleanup
        });
    }

    const afterLint = write
        ? runLint(workspaceRoot, optionPluginPath, {
            scanReferences,
            enableRhinoChecks
        })
        : null;

    return {
        mode: write ? 'write' : 'propose',
        scope: scanReferences ? 'references' : 'extensions',
        summary: {
            targets: targets.length,
            changedTargets,
            changes: totalChanges
        },
        beforeLint,
        afterLint,
        results
    };
}

function printFixTableReport(report) {
    console.log('');
    console.log('VBook Fix Report');
    console.log('================');
    console.log(`Mode: ${report.mode}`);
    console.log(`Scope: ${report.scope}`);

    let appliedCount = 0;
    let proposedWarnCount = 0;

    for (const item of report.results) {
        const isDirty = item.changes.length > 0 || item.cleanup.length > 0;
        const status = item.error
            ? 'error'
            : isDirty
                ? (report.mode === 'write' ? 'updated' : 'proposed')
                : 'clean';

        console.log('');
        console.log(`- ${item.name} (${item.root}) -> ${status}`);

        if (item.error) {
            console.log(`  ${item.error}`);
            continue;
        }

        for (const change of item.changes) {
            if (change.action === 'propose-warn') {
                proposedWarnCount++;
                console.log(`  warning: ${change.field} (${change.to})`);
            } else if (change.action === 'rename') {
                if (report.mode === 'write') appliedCount++;
                console.log(`  ${change.action}: ${change.from} -> ${change.field}`);
            } else {
                if (report.mode === 'write') appliedCount++;
                console.log(`  ${change.action}: ${change.field} (${change.from} -> ${change.to})`);
            }
        }

        for (const filePath of item.cleanup) {
            console.log(`  cleanup: removed ${filePath}`);
        }
    }

    console.log('');
    console.log(
        `${appliedCount} fixes applied, ${proposedWarnCount} warnings proposed.`
    );

    console.log('');
    console.log(
        `Targets: ${report.summary.targets} | Changed: ${report.summary.changedTargets} | Changes: ${report.summary.changes}`
    );

    const before = report.beforeLint.summary.counts;
    console.log(
        `Lint(before): errors=${before.error} warnings=${before.warning}`
    );

    if (report.afterLint) {
        const after = report.afterLint.summary.counts;
        console.log(
            `Lint(after):  errors=${after.error} warnings=${after.warning}`
        );
    }
}

module.exports = {
    runFix,
    printFixTableReport
};
