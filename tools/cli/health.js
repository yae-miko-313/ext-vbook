const { runLint } = require('./lint');

function incrementCounter(counterMap, key) {
    const safeKey = key || 'unknown';
    counterMap[safeKey] = (counterMap[safeKey] || 0) + 1;
}

function parsePluginBasics(report) {
    const byType = {};
    const byLocale = {};
    const quality = {
        clean: 0,
        withErrors: 0,
        withWarningsOnly: 0
    };

    for (const item of report.results) {
        const errorCount = item.issues.filter((x) => x.severity === 'error').length;
        const warningCount = item.issues.filter((x) => x.severity === 'warning').length;

        if (errorCount > 0) {
            quality.withErrors += 1;
        } else if (warningCount > 0) {
            quality.withWarningsOnly += 1;
        } else {
            quality.clean += 1;
        }

        const typeIssue = item.issues.find((x) => x.ruleId === 'metadata.type');
        const localeIssue = item.issues.find((x) => x.ruleId === 'metadata.locale');

        incrementCounter(byType, typeIssue ? 'invalid-or-missing' : 'declared');
        incrementCounter(byLocale, localeIssue ? 'invalid-or-missing' : 'declared');
    }

    return { byType, byLocale, quality };
}

function topRuleCounts(report, limit = 10) {
    const counts = new Map();
    for (const item of report.results) {
        for (const issue of item.issues) {
            const key = `${issue.severity}:${issue.ruleId}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    }

    return Array.from(counts.entries())
        .map(([key, count]) => {
            const [severity, ruleId] = key.split(':');
            return { severity, ruleId, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function buildHealthReport(workspaceRoot, options = {}) {
    const lintReport = runLint(workspaceRoot, options.plugin, {
        scanReferences: Boolean(options.scanReferences),
        enableRhinoChecks: Boolean(options.enableRhinoChecks)
    });

    const parsed = parsePluginBasics(lintReport);

    return {
        scope: lintReport.scope,
        summary: lintReport.summary,
        quality: parsed.quality,
        metadataCoverage: {
            type: parsed.byType,
            locale: parsed.byLocale
        },
        topIssues: topRuleCounts(lintReport, 15),
        scannedTargets: lintReport.scannedTargets
    };
}

function printHealthTableReport(report) {
    console.log('');
    console.log('VBook Health Report');
    console.log('===================');
    console.log(`Scope: ${report.scope}`);
    console.log(
        `Targets: ${report.summary.counts.targets} | Errors: ${report.summary.counts.error} | Warnings: ${report.summary.counts.warning}`
    );
    console.log(
        `Quality: clean=${report.quality.clean}, warnings-only=${report.quality.withWarningsOnly}, with-errors=${report.quality.withErrors}`
    );

    console.log('');
    console.log('Top Rules:');
    if (!report.topIssues.length) {
        console.log('No issues found.');
        return;
    }

    const ruleWidth = Math.max('Rule'.length, ...report.topIssues.map((x) => x.ruleId.length));
    const sevWidth = Math.max('Severity'.length, ...report.topIssues.map((x) => x.severity.length));
    const countWidth = Math.max('Count'.length, ...report.topIssues.map((x) => String(x.count).length));

    const header = [
        'Severity'.padEnd(sevWidth),
        'Rule'.padEnd(ruleWidth),
        'Count'.padEnd(countWidth)
    ].join(' | ');
    console.log(header);
    console.log('-'.repeat(header.length));

    for (const item of report.topIssues) {
        console.log(
            [
                item.severity.toUpperCase().padEnd(sevWidth),
                item.ruleId.padEnd(ruleWidth),
                String(item.count).padEnd(countWidth)
            ].join(' | ')
        );
    }
}

module.exports = {
    buildHealthReport,
    printHealthTableReport
};
