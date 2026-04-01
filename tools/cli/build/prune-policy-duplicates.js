const fs = require('fs');
const path = require('path');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function parseVersion(version) {
    if (typeof version === 'number' && Number.isFinite(version)) return version;
    if (typeof version === 'string') {
        const trimmed = version.trim();
        if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    }
    return 0;
}

function getDomain(source) {
    if (typeof source !== 'string' || !source.trim()) return null;
    try {
        const u = new URL(source.trim());
        return u.hostname.toLowerCase().replace(/^www\./, '');
    } catch (error) {
        return null;
    }
}

function normalizeAuthor(author) {
    if (typeof author !== 'string') return '_unknown';
    const value = author.trim().toLowerCase();
    return value || '_unknown';
}

function toPosixPath(value) {
    return value.split(path.sep).join('/');
}

function collectEntriesFromExtensions(workspaceRoot) {
    const extensionsRoot = path.join(workspaceRoot, 'extensions');
    const entries = [];

    if (!fs.existsSync(extensionsRoot)) return entries;

    const typeDirs = fs.readdirSync(extensionsRoot, { withFileTypes: true });
    for (const typeDir of typeDirs) {
        if (!typeDir.isDirectory()) continue;

        const typeName = typeDir.name;
        const typePath = path.join(extensionsRoot, typeName);
        const pluginFolders = fs.readdirSync(typePath, { withFileTypes: true });

        for (const folderDir of pluginFolders) {
            if (!folderDir.isDirectory()) continue;

            const folderName = folderDir.name;
            const pluginPath = path.join(typePath, folderName, 'plugin.json');
            if (!fs.existsSync(pluginPath)) continue;

            let parsed;
            try {
                parsed = readJson(pluginPath);
            } catch (error) {
                continue;
            }

            const metadata = parsed && parsed.metadata && typeof parsed.metadata === 'object'
                ? parsed.metadata
                : {};

            const relativePath = toPosixPath(path.relative(workspaceRoot, path.join(typePath, folderName)));

            entries.push({
                type: metadata.type || typeName,
                folder: folderName,
                author: metadata.author || null,
                source: metadata.source || null,
                version: parseVersion(metadata.version),
                relativePath,
                name: metadata.name || folderName
            });
        }
    }

    return entries;
}

function compareEntries(a, b) {
    if (a.version !== b.version) return b.version - a.version;

    const pathA = String(a.relativePath || '').toLowerCase();
    const pathB = String(b.relativePath || '').toLowerCase();
    return pathA.localeCompare(pathB);
}

function runPrune(workspaceRoot) {
    const reportPath = path.join(workspaceRoot, 'tools', 'cli', 'reports', 'policy-prune-report.json');

    const allEntries = collectEntriesFromExtensions(workspaceRoot);

    const groups = new Map();
    for (const entry of allEntries) {
        const domain = getDomain(entry.source);
        if (!domain) continue;
        const key = `domain:${domain}|author:${normalizeAuthor(entry.author)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(entry);
    }

    const violations = [];
    const removed = [];
    const kept = [];

    for (const [key, entries] of groups.entries()) {
        if (entries.length <= 1) continue;

        const sorted = [...entries].sort(compareEntries);
        const winner = sorted[0];
        const losers = sorted.slice(1);

        kept.push({ key, winner });
        violations.push({
            key,
            count: entries.length,
            winner,
            losers
        });

        for (const loser of losers) {
            const rel = loser.relativePath;
            if (!rel) continue;
            const abs = path.join(workspaceRoot, ...rel.split('/'));
            if (!fs.existsSync(abs)) {
                removed.push({ key, relativePath: rel, status: 'missing' });
                continue;
            }
            fs.rmSync(abs, { recursive: true, force: true });
            removed.push({
                key,
                relativePath: rel,
                status: 'removed',
                winner: winner.relativePath
            });
        }
    }

    const report = {
        generatedAt: new Date().toISOString(),
        summary: {
            totalEntries: allEntries.length,
            violatingGroups: violations.length,
            removedFolders: removed.filter((x) => x.status === 'removed').length,
            missingFolders: removed.filter((x) => x.status === 'missing').length
        },
        violations,
        removed
    };

    writeJson(reportPath, report);

    return report;
}

function printReport(report) {
    console.log('');
    console.log('Policy Prune Report');
    console.log('===================');
    console.log(`Violating groups: ${report.summary.violatingGroups}`);
    console.log(`Removed folders: ${report.summary.removedFolders}`);
    console.log(`Missing folders: ${report.summary.missingFolders}`);
}

if (require.main === module) {
    const workspaceRoot = process.cwd();
    const report = runPrune(workspaceRoot);
    printReport(report);
}

module.exports = {
    runPrune
};
