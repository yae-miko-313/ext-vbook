const fs = require('fs');
const path = require('path');
const { runLint } = require('./lint');
const { runFix } = require('./fix');
const { runOfflineVerify } = require('./verify');
const {
    VALID_TYPES,
    readJson,
    relativeFromWorkspace,
    resolveFixReportPath,
    writeJson
} = require('./migration-utils');

const REQUIRED_SCRIPT_KEYS_BY_TYPE = {
    novel: new Set(['detail', 'toc', 'chap']),
    comic: new Set(['detail', 'toc', 'chap']),
    chinese_novel: new Set(['detail', 'toc', 'chap'])
};

function inferTypeFromPlugin(pluginRoot, pluginJson) {
    const parentType = path.basename(path.dirname(pluginRoot));
    if (VALID_TYPES.includes(parentType)) return parentType;

    const script = pluginJson.script || {};
    if (Object.prototype.hasOwnProperty.call(script, 'translate')) return 'translate';
    if (Object.prototype.hasOwnProperty.call(script, 'synthesize')) return 'tts';

    const hasCoreReader = ['detail', 'toc', 'chap'].every((key) =>
        Object.prototype.hasOwnProperty.call(script, key)
    );
    if (hasCoreReader) return 'novel';

    return null;
}

function ensureIconIfMissing(workspaceRoot, pluginRoot, actionLog) {
    const iconPath = path.join(pluginRoot, 'icon.png');
    if (fs.existsSync(iconPath)) return false;

    const fallbackIcon = path.join(workspaceRoot, 'extensions', 'vbook-ext-template', 'icon.png');
    if (!fs.existsSync(fallbackIcon)) return false;

    fs.copyFileSync(fallbackIcon, iconPath);
    actionLog.push('copied-fallback-icon');
    return true;
}

function generateDefaultRegexpFromSource(source) {
    if (typeof source !== 'string' || !source.trim()) return null;
    try {
        const host = new URL(source.trim()).hostname.replace(/\./g, '\\.');
        return `${host}/[^/]+/?$`;
    } catch (error) {
        return null;
    }
}

function ensureScriptStub(pluginRoot, filename, actionLog) {
    const scriptPath = path.join(pluginRoot, 'src', filename);
    if (fs.existsSync(scriptPath)) return false;

    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
    const stub = [
        'function execute() {',
        '    return "";',
        '}',
        ''
    ].join('\n');
    fs.writeFileSync(scriptPath, stub, 'utf8');
    actionLog.push(`created-script-stub:${filename}`);
    return true;
}

function applyAiHeuristics(workspaceRoot, pluginRoot, lintReport) {
    const pluginJsonPath = path.join(pluginRoot, 'plugin.json');
    const pluginJson = readJson(pluginJsonPath);
    const issues = lintReport.results.flatMap((result) => result.issues || []);
    const actionLog = [];

    if (!pluginJson.metadata || typeof pluginJson.metadata !== 'object' || Array.isArray(pluginJson.metadata)) {
        pluginJson.metadata = {};
        actionLog.push('created-metadata-object');
    }

    if (!pluginJson.script || typeof pluginJson.script !== 'object' || Array.isArray(pluginJson.script)) {
        pluginJson.script = {};
        actionLog.push('created-script-object');
    }

    for (const issue of issues) {
        if (issue.severity !== 'error') continue;

        if (issue.ruleId === 'metadata.type') {
            const inferred = inferTypeFromPlugin(pluginRoot, pluginJson);
            if (inferred && pluginJson.metadata.type !== inferred) {
                pluginJson.metadata.type = inferred;
                actionLog.push(`set-metadata.type:${inferred}`);
            }
            continue;
        }

        if (issue.ruleId === 'metadata.regexp') {
            const source = typeof pluginJson.metadata.source === 'string' ? pluginJson.metadata.source.trim() : '';
            const generatedRegexp = generateDefaultRegexpFromSource(source);
            if (generatedRegexp && pluginJson.metadata.regexp !== generatedRegexp) {
                pluginJson.metadata.regexp = generatedRegexp;
                actionLog.push('generated-metadata.regexp-from-source');
            }
            continue;
        }

        if (issue.ruleId === 'metadata.regexp-parse') {
            const source = typeof pluginJson.metadata.source === 'string' ? pluginJson.metadata.source.trim() : '';
            const generatedRegexp = generateDefaultRegexpFromSource(source);
            if (generatedRegexp && pluginJson.metadata.regexp !== generatedRegexp) {
                pluginJson.metadata.regexp = generatedRegexp;
                actionLog.push('replaced-invalid-regexp-from-source');
            }
            continue;
        }

        if (issue.ruleId === 'src.required-file') {
            const match = issue.message.match(/Missing required source file: src\/(.+)$/);
            if (match && match[1]) {
                ensureScriptStub(pluginRoot, match[1], actionLog);
            }
            continue;
        }

        if (issue.ruleId === 'script.file-exists') {
            const match = issue.message.match(/script\.([a-zA-Z0-9_]+) points to missing file/);
            if (!match) continue;

            const key = match[1];
            const metadataType = String(pluginJson.metadata.type || '').toLowerCase();
            const required = REQUIRED_SCRIPT_KEYS_BY_TYPE[metadataType] || new Set();
            if (!required.has(key) && Object.prototype.hasOwnProperty.call(pluginJson.script, key)) {
                delete pluginJson.script[key];
                actionLog.push(`removed-optional-script:${key}`);
            }
            continue;
        }
    }

    if (ensureIconIfMissing(workspaceRoot, pluginRoot, actionLog)) {
        // icon fix already logged
    }

    if (actionLog.length === 0) {
        return { changed: false, actionLog };
    }

    fs.writeFileSync(pluginJsonPath, `${JSON.stringify(pluginJson, null, 2)}\n`, 'utf8');
    return { changed: true, actionLog };
}

function runAiFixQueue(workspaceRoot, options = {}) {
    const fixReportPath = resolveFixReportPath(workspaceRoot, options.input);
    const fixReport = readJson(fixReportPath);
    const maxAttempts = Number.isInteger(options.maxAttempts) ? options.maxAttempts : 2;
    const candidates = (fixReport.items || []).filter((item) => item.finalStatus === 'needs_ai');

    const results = [];
    for (const item of candidates) {
        const pluginRoot = path.resolve(workspaceRoot, item.pluginRoot);
        const attemptLogs = [];
        let finalStatus = 'needs_human';
        let finalReason = 'max-attempts-reached';

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            const lintBefore = runLint(workspaceRoot, pluginRoot, {
                scanReferences: false,
                enableRhinoChecks: false
            });

            if (lintBefore.summary.counts.error === 0) {
                const verify = runOfflineVerify(workspaceRoot, pluginRoot, { rhino: false });
                if (verify.success) {
                    finalStatus = 'fixed';
                    finalReason = 'already-pass-offline-verify';
                    attemptLogs.push({ attempt, changes: [], verify: { success: true } });
                    break;
                }
            }

            const heuristicResult = applyAiHeuristics(workspaceRoot, pluginRoot, lintBefore);
            if (!heuristicResult.changed) {
                attemptLogs.push({
                    attempt,
                    changes: heuristicResult.actionLog,
                    verify: { success: false, reason: 'no-heuristic-change' }
                });
                finalStatus = 'needs_human';
                finalReason = 'no-heuristic-change';
                break;
            }

            runFix(workspaceRoot, pluginRoot, {
                scanReferences: false,
                enableRhinoChecks: false,
                write: true,
                cleanupNoise: true
            });

            const verify = runOfflineVerify(workspaceRoot, pluginRoot, { rhino: false });
            attemptLogs.push({
                attempt,
                changes: heuristicResult.actionLog,
                verify: {
                    success: verify.success,
                    errors: verify.lintReport.summary.counts.error,
                    warnings: verify.lintReport.summary.counts.warning
                }
            });

            if (verify.success) {
                finalStatus = 'fixed';
                finalReason = 'offline-verify-pass';
                break;
            }

            finalStatus = 'needs_human';
            finalReason = 'verify-failed-after-heuristics';
        }

        results.push({
            pluginRoot: item.pluginRoot,
            finalStatus,
            finalReason,
            attempts: attemptLogs
        });
    }

    const summary = {
        total: results.length,
        fixed: results.filter((item) => item.finalStatus === 'fixed').length,
        needsHuman: results.filter((item) => item.finalStatus === 'needs_human').length
    };

    const report = {
        generatedAt: new Date().toISOString(),
        inputFixReport: relativeFromWorkspace(workspaceRoot, fixReportPath),
        maxAttempts,
        summary,
        items: results
    };

    const outputPath = path.join(workspaceRoot, 'tools', 'cli', 'reports', 'ai-fix-report.json');
    writeJson(outputPath, report);

    return {
        reportPath: relativeFromWorkspace(workspaceRoot, outputPath),
        ...report
    };
}

function printAiFixQueueReport(report) {
    console.log('');
    console.log('VBook AI Fix Queue Report');
    console.log('=========================');
    console.log(`Input: ${report.inputFixReport}`);
    console.log(`Report: ${report.reportPath}`);
    console.log(`MaxAttempts: ${report.maxAttempts}`);
    console.log(`Total: ${report.summary.total} | Fixed: ${report.summary.fixed} | NeedsHuman: ${report.summary.needsHuman}`);
}

module.exports = {
    runAiFixQueue,
    printAiFixQueueReport
};
