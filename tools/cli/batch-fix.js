const path = require('path');
const { runFix } = require('./fix');
const { runLint } = require('./lint');
const {
    collectPluginRootsRecursively,
    relativeFromWorkspace,
    resolveFixReportPath,
    writeJson
} = require('./migration-utils');

function discoverPluginRootsUnder(workspaceRoot, relativeDir) {
    const absoluteDir = path.resolve(workspaceRoot, relativeDir);
    const roots = [];
    collectPluginRootsRecursively(absoluteDir, roots);
    roots.sort((a, b) => a.localeCompare(b));
    return roots;
}

function classifyFinalStatus(beforeReport, afterReport) {
    const beforeCounts = beforeReport.summary.counts;
    const afterCounts = afterReport.summary.counts;

    if (afterCounts.error === 0 && beforeCounts.error > 0) return 'fixed';
    if (afterCounts.error === 0) return 'warnings_only';
    return 'needs_ai';
}

function runBatchFix(workspaceRoot, options = {}) {
    const targetDir = options.target || 'extensions';
    const pluginRoots = discoverPluginRootsUnder(workspaceRoot, targetDir);
    const items = [];

    for (const pluginRoot of pluginRoots) {
        const relativePluginRoot = relativeFromWorkspace(workspaceRoot, pluginRoot);
        const beforeReport = runLint(workspaceRoot, pluginRoot, {
            scanReferences: false,
            enableRhinoChecks: Boolean(options.rhino)
        });

        const beforeCounts = beforeReport.summary.counts;
        let fixReport = null;
        let afterReport = beforeReport;
        let failureReason = null;

        try {
            if (beforeCounts.error > 0) {
                fixReport = runFix(workspaceRoot, pluginRoot, {
                    scanReferences: false,
                    enableRhinoChecks: Boolean(options.rhino),
                    write: true,
                    cleanupNoise: true
                });
                afterReport = fixReport.afterLint || runLint(workspaceRoot, pluginRoot, {
                    scanReferences: false,
                    enableRhinoChecks: Boolean(options.rhino)
                });
            }
        } catch (error) {
            failureReason = error.message;
            afterReport = runLint(workspaceRoot, pluginRoot, {
                scanReferences: false,
                enableRhinoChecks: Boolean(options.rhino)
            });
        }

        const status = classifyFinalStatus(beforeReport, afterReport);
        const afterCounts = afterReport.summary.counts;

        items.push({
            pluginRoot: relativePluginRoot,
            beforeCounts,
            afterCounts,
            fixesApplied: fixReport ? fixReport.summary.changes : 0,
            changedTargets: fixReport ? fixReport.summary.changedTargets : 0,
            finalStatus: status,
            failureReason
        });
    }

    const summary = {
        total: items.length,
        fixed: items.filter((item) => item.finalStatus === 'fixed').length,
        warningsOnly: items.filter((item) => item.finalStatus === 'warnings_only').length,
        needsAi: items.filter((item) => item.finalStatus === 'needs_ai').length
    };

    const report = {
        generatedAt: new Date().toISOString(),
        targetDir,
        summary,
        items
    };

    const outputPath = resolveFixReportPath(workspaceRoot, options.out);
    writeJson(outputPath, report);

    return {
        reportPath: relativeFromWorkspace(workspaceRoot, outputPath),
        ...report
    };
}

function printBatchFixReport(report) {
    console.log('');
    console.log('VBook Batch Fix Report');
    console.log('======================');
    console.log(`Target: ${report.targetDir}`);
    console.log(`Report: ${report.reportPath}`);
    console.log(`Total: ${report.summary.total} | Fixed: ${report.summary.fixed} | WarningsOnly: ${report.summary.warningsOnly} | NeedsAI: ${report.summary.needsAi}`);
}

module.exports = {
    runBatchFix,
    printBatchFixReport
};
