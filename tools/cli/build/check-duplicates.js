const fs = require('fs');
const path = require('path');

function readCatalog(workspaceRoot) {
    const catalogPath = path.join(workspaceRoot, 'web', 'catalog.json');
    if (!fs.existsSync(catalogPath)) {
        throw new Error(`catalog.json not found: ${catalogPath}`);
    }
    return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

function runCheckDuplicates(workspaceRoot, options = {}) {
    const catalog = readCatalog(workspaceRoot);
    const sourceMap = new Map();
    const violations = [];
    let allowedMultiAuthorSources = 0;

    Object.keys(catalog).forEach((type) => {
        const list = catalog[type];
        if (!Array.isArray(list)) {
            return;
        }

        list.forEach((ext) => {
            const source = ext.source || 'Unknown';
            const entry = {
                name: ext.name || 'Unknown',
                folder: ext.folder || 'Unknown',
                author: ext.author || 'Unknown',
                type,
                version: ext.version || 0
            };

            if (!sourceMap.has(source)) {
                sourceMap.set(source, []);
            }
            sourceMap.get(source).push(entry);
        });
    });

    let totalExtensions = 0;
    let duplicateSources = 0;
    const duplicateDetails = [];

    sourceMap.forEach((extensions, source) => {
        totalExtensions += extensions.length;

        if (extensions.length <= 1) {
            return;
        }

        duplicateSources += 1;
        const authorCounter = new Map();

        extensions.forEach((ext) => {
            const key = ext.author || 'Unknown';
            authorCounter.set(key, (authorCounter.get(key) || 0) + 1);
        });

        const repeatedAuthors = Array.from(authorCounter.entries())
            .filter((entry) => entry[1] > 1)
            .map((entry) => ({ author: entry[0], count: entry[1] }));

        const detail = {
            source,
            count: extensions.length,
            extensions,
            repeatedAuthors,
            policyOk: repeatedAuthors.length === 0
        };

        duplicateDetails.push(detail);

        if (repeatedAuthors.length > 0) {
            violations.push({
                source,
                extensions,
                repeatedAuthors
            });
        } else {
            allowedMultiAuthorSources += 1;
        }
    });

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalExtensions,
            totalSources: sourceMap.size,
            duplicateSources,
            allowedMultiAuthorSources,
            policyViolationSources: violations.length
        },
        policy: {
            allowSameSourceDifferentAuthor: true,
            violationRule: 'same-source-same-author'
        },
        duplicates: duplicateDetails,
        violations
    };

    const outputPath = options.out
        ? path.resolve(workspaceRoot, options.out)
        : path.join(workspaceRoot, 'tools', 'cli', 'reports', 'duplicate_sources_report.json');

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    return {
        outputPath,
        report
    };
}

function printCheckDuplicatesReport(result) {
    const summary = result.report.summary;

    console.log('KIEM TRA TRUNG LAP EXTENSIONS THEO SOURCE');
    console.log('============================================================');
    console.log(`Tong so extensions: ${summary.totalExtensions}`);
    console.log(`Tong so sources: ${summary.totalSources}`);
    console.log(`So sources co trung lap: ${summary.duplicateSources}`);
    console.log(`So sources hop le nhieu tac gia: ${summary.allowedMultiAuthorSources}`);
    console.log(`So sources vi pham policy: ${summary.policyViolationSources}`);
    console.log(`Report: ${path.relative(process.cwd(), result.outputPath)}`);
}

module.exports = {
    runCheckDuplicates,
    printCheckDuplicatesReport
};
