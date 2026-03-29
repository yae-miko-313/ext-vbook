const fs = require('fs');
const path = require('path');
const {
    normalizeType,
    readJson,
    relativeFromWorkspace,
    resolveInventoryPath,
    writeJson
} = require('./migration-utils');

function copyDirRecursive(sourceDir, targetDir) {
    fs.mkdirSync(targetDir, { recursive: true });
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(sourceDir, entry.name);
        const dstPath = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, dstPath);
        } else {
            fs.copyFileSync(srcPath, dstPath);
        }
    }
}

function runSort(workspaceRoot, options = {}) {
    const inventoryPath = resolveInventoryPath(workspaceRoot, options.inventory);
    const inventory = readJson(inventoryPath);
    const outputRoot = path.join(workspaceRoot, 'extensions');
    const overwriteExisting = Boolean(options.overwriteExisting);
    const cleanupRoot = Boolean(options.cleanupRoot);
    const protectedRootFolders = new Set(['vbook-ext-template']);

    if (!Array.isArray(inventory.items)) {
        throw new Error('inventory.json is invalid: missing items array.');
    }

    const itemsToCopy = inventory.items.filter((item) => item.keepFlag && !item.error);
    const results = [];

    for (const item of itemsToCopy) {
        const sourceRoot = path.resolve(workspaceRoot, item.root);
        const groupType = normalizeType(item.type);
        const destinationRoot = path.join(outputRoot, groupType, item.folderName);
        const relativeDestination = relativeFromWorkspace(workspaceRoot, destinationRoot);
        const sourceInExtensionsRoot = item.root.startsWith('extensions/');
        const isRootLevelSource = sourceInExtensionsRoot && item.root.split('/').length === 2;
        const shouldCleanupSource =
            cleanupRoot &&
            isRootLevelSource &&
            !protectedRootFolders.has(item.folderName) &&
            sourceRoot !== destinationRoot;

        if (!fs.existsSync(sourceRoot)) {
            results.push({
                source: item.root,
                destination: relativeDestination,
                status: 'error',
                reason: 'source-missing'
            });
            continue;
        }

        if (fs.existsSync(destinationRoot)) {
            if (overwriteExisting) {
                fs.rmSync(destinationRoot, { recursive: true, force: true });
                copyDirRecursive(sourceRoot, destinationRoot);
                if (shouldCleanupSource && fs.existsSync(sourceRoot)) {
                    fs.rmSync(sourceRoot, { recursive: true, force: true });
                }
                results.push({
                    source: item.root,
                    destination: relativeDestination,
                    status: 'overwritten',
                    reason: shouldCleanupSource ? 'root-cleaned' : null
                });
                continue;
            }

            results.push({
                source: item.root,
                destination: relativeDestination,
                status: 'skipped_existing',
                reason: 'destination-exists'
            });
            continue;
        }

        copyDirRecursive(sourceRoot, destinationRoot);
        if (shouldCleanupSource && fs.existsSync(sourceRoot)) {
            fs.rmSync(sourceRoot, { recursive: true, force: true });
        }
        results.push({
            source: item.root,
            destination: relativeDestination,
            status: 'copied',
            reason: shouldCleanupSource ? 'root-cleaned' : null
        });
    }

    const summary = {
        totalCandidates: itemsToCopy.length,
        copied: results.filter((item) => item.status === 'copied').length,
        overwritten: results.filter((item) => item.status === 'overwritten').length,
        skippedExisting: results.filter((item) => item.status === 'skipped_existing').length,
        errors: results.filter((item) => item.status === 'error').length,
        cleanedRootSources: results.filter((item) => item.reason === 'root-cleaned').length
    };

    const report = {
        generatedAt: new Date().toISOString(),
        inventoryPath: relativeFromWorkspace(workspaceRoot, inventoryPath),
        summary,
        items: results
    };

    const reportPath = path.join(workspaceRoot, 'tools', 'cli', 'reports', 'sort-report.json');
    writeJson(reportPath, report);

    return {
        reportPath: relativeFromWorkspace(workspaceRoot, reportPath),
        ...report
    };
}

function printSortReport(report) {
    console.log('');
    console.log('VBook Sort Report');
    console.log('=================');
    console.log(`Inventory: ${report.inventoryPath}`);
    console.log(`Report: ${report.reportPath}`);
    console.log(`Candidates: ${report.summary.totalCandidates} | Copied: ${report.summary.copied} | Overwritten: ${report.summary.overwritten} | SkippedExisting: ${report.summary.skippedExisting} | Errors: ${report.summary.errors}`);
    console.log(`Cleaned root sources: ${report.summary.cleanedRootSources}`);
}

module.exports = {
    runSort,
    printSortReport
};
