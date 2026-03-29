const path = require('path');
const {
    compareCandidates,
    classifyRepoSource,
    discoverAllPluginRoots,
    getDedupeKey,
    normalizeLocale,
    normalizeType,
    parseVersion,
    readJson,
    relativeFromWorkspace,
    resolveInventoryPath,
    tryGetSourceDomain,
    writeJson
} = require('./migration-utils');

function buildInventory(workspaceRoot) {
    const pluginRoots = discoverAllPluginRoots(workspaceRoot);
    const records = [];

    for (const absoluteRoot of pluginRoots) {
        const pluginJsonPath = path.join(absoluteRoot, 'plugin.json');
        const relativeRoot = relativeFromWorkspace(workspaceRoot, absoluteRoot);

        let plugin;
        try {
            plugin = readJson(pluginJsonPath);
        } catch (error) {
            records.push({
                id: relativeRoot,
                root: relativeRoot,
                relativeRoot,
                pluginJson: relativeFromWorkspace(workspaceRoot, pluginJsonPath),
                error: `Cannot parse plugin.json: ${error.message}`,
                keepFlag: false,
                isDuplicate: false,
                duplicateOf: null,
                repoSource: classifyRepoSource(relativeRoot),
                dedupeKey: null,
                decisionReason: 'invalid-plugin-json'
            });
            continue;
        }

        const metadata = plugin && plugin.metadata && typeof plugin.metadata === 'object'
            ? plugin.metadata
            : {};

        const record = {
            id: relativeRoot,
            root: relativeRoot,
            relativeRoot,
            pluginJson: relativeFromWorkspace(workspaceRoot, pluginJsonPath),
            folderName: path.basename(absoluteRoot),
            name: typeof metadata.name === 'string' ? metadata.name : null,
            author: typeof metadata.author === 'string' ? metadata.author : null,
            source: typeof metadata.source === 'string' ? metadata.source : null,
            sourceDomain: tryGetSourceDomain(metadata.source),
            type: normalizeType(metadata.type),
            rawType: typeof metadata.type === 'string' ? metadata.type : null,
            version: parseVersion(metadata.version),
            rawVersion: metadata.version,
            locale: normalizeLocale(metadata.locale),
            repoSource: classifyRepoSource(relativeRoot),
            dedupeKey: getDedupeKey(metadata),
            keepFlag: false,
            isDuplicate: false,
            duplicateOf: null,
            decisionReason: null
        };

        records.push(record);
    }

    const groups = new Map();
    for (const item of records) {
        if (!item.dedupeKey) {
            item.keepFlag = true;
            item.decisionReason = 'no-dedupe-key';
            continue;
        }

        if (!groups.has(item.dedupeKey)) {
            groups.set(item.dedupeKey, []);
        }
        groups.get(item.dedupeKey).push(item);
    }

    for (const [dedupeKey, items] of groups.entries()) {
        if (items.length === 1) {
            items[0].keepFlag = true;
            items[0].decisionReason = 'unique-key';
            continue;
        }

        items.sort(compareCandidates);
        const winner = items[0];
        winner.keepFlag = true;
        winner.isDuplicate = false;
        winner.decisionReason = 'winner-by-version-repo-priority';

        for (let i = 1; i < items.length; i += 1) {
            items[i].keepFlag = false;
            items[i].isDuplicate = true;
            items[i].duplicateOf = winner.id;
            items[i].decisionReason = `duplicate-of:${winner.id}`;
        }

        groups.set(dedupeKey, items);
    }

    const summary = {
        total: records.length,
        keep: records.filter((item) => item.keepFlag).length,
        duplicates: records.filter((item) => item.isDuplicate).length,
        parseErrors: records.filter((item) => item.error).length,
        byRepoSource: {
            extensions: records.filter((item) => item.repoSource === 'extensions').length,
            darkrai9x: records.filter((item) => item.repoSource === 'darkrai9x').length,
            'dat-bi': records.filter((item) => item.repoSource === 'dat-bi').length,
            others: records.filter((item) => item.repoSource === 'others').length
        },
        byType: {
            novel: records.filter((item) => item.type === 'novel').length,
            comic: records.filter((item) => item.type === 'comic').length,
            chinese_novel: records.filter((item) => item.type === 'chinese_novel').length,
            translate: records.filter((item) => item.type === 'translate').length,
            tts: records.filter((item) => item.type === 'tts').length,
            _unknown: records.filter((item) => item.type === '_unknown').length
        }
    };

    return {
        generatedAt: new Date().toISOString(),
        summary,
        items: records
    };
}

function runInventory(workspaceRoot, options = {}) {
    const inventoryPath = resolveInventoryPath(workspaceRoot, options.out);
    const report = buildInventory(workspaceRoot);
    writeJson(inventoryPath, report);

    return {
        reportPath: relativeFromWorkspace(workspaceRoot, inventoryPath),
        ...report
    };
}

function printInventoryReport(report) {
    console.log('');
    console.log('VBook Inventory Report');
    console.log('======================');
    console.log(`Generated: ${report.generatedAt}`);
    console.log(`Report: ${report.reportPath}`);
    console.log(`Total: ${report.summary.total} | Keep: ${report.summary.keep} | Duplicates: ${report.summary.duplicates} | ParseErrors: ${report.summary.parseErrors}`);
    console.log('');
    console.log('By Repo Source');
    console.log(`- extensions: ${report.summary.byRepoSource.extensions}`);
    console.log(`- darkrai9x: ${report.summary.byRepoSource.darkrai9x}`);
    console.log(`- dat-bi: ${report.summary.byRepoSource['dat-bi']}`);
    console.log(`- others: ${report.summary.byRepoSource.others}`);
    console.log('');
    console.log('By Type');
    console.log(`- novel: ${report.summary.byType.novel}`);
    console.log(`- comic: ${report.summary.byType.comic}`);
    console.log(`- chinese_novel: ${report.summary.byType.chinese_novel}`);
    console.log(`- translate: ${report.summary.byType.translate}`);
    console.log(`- tts: ${report.summary.byType.tts}`);
    console.log(`- _unknown: ${report.summary.byType._unknown}`);
}

module.exports = {
    runInventory,
    printInventoryReport
};
