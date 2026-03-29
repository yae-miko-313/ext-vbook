const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { runLint } = require('./lint');

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

function hasExecuteFunction(filePath) {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf8');
    return /function\s+execute\s*\(/.test(content);
}

function runOfflineVerify(workspaceRoot, pluginPath, options = {}) {
    const pluginRoot = findPluginRoot(pluginPath || process.cwd());
    if (!pluginRoot) {
        throw new Error('plugin.json not found. Use --plugin or run from extension folder.');
    }

    const pluginJsonPath = path.join(pluginRoot, 'plugin.json');
    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    const script = plugin.script || {};

    const lintReport = runLint(workspaceRoot, pluginRoot, {
        scanReferences: false,
        enableRhinoChecks: Boolean(options.rhino)
    });

    const steps = [];
    steps.push({
        id: 'lint',
        success: lintReport.summary.counts.error === 0,
        details: {
            errors: lintReport.summary.counts.error,
            warnings: lintReport.summary.counts.warning
        }
    });

    const requiredScriptEntries = ['detail', 'toc', 'chap'];
    for (const entry of requiredScriptEntries) {
        const filename = script[entry];
        const filePath = filename ? path.join(pluginRoot, 'src', filename) : '';
        const success = Boolean(filename) && hasExecuteFunction(filePath);
        steps.push({
            id: `script-${entry}`,
            success,
            details: {
                filename: filename || null,
                hasExecute: success
            }
        });
    }

    if (script.home) {
        const homePath = path.join(pluginRoot, 'src', script.home);
        steps.push({
            id: 'script-home',
            success: hasExecuteFunction(homePath),
            details: {
                filename: script.home,
                hasExecute: hasExecuteFunction(homePath)
            }
        });
    }

    const success = steps.every((step) => step.success);
    return {
        mode: 'offline-structure',
        pluginRoot: path.relative(workspaceRoot, pluginRoot),
        success,
        steps,
        lintReport
    };
}

function runCommand(command, args) {
    return new Promise((resolve) => {
        const child = spawn(command, args, { shell: false });
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });
        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });
    });
}

async function runOnlineVerify(workspaceRoot, options = {}) {
    const pluginRoot = findPluginRoot(options.plugin || process.cwd());
    if (!pluginRoot) {
        throw new Error('plugin.json not found. Use --plugin or run from extension folder.');
    }

    const indexPath = path.join(workspaceRoot, 'tools', 'cli', 'index.js');
    const args = [indexPath, 'test-all', '--plugin', pluginRoot];

    if (options.ip) {
        args.push('--ip', String(options.ip));
    }
    if (options.port) {
        args.push('--port', String(options.port));
    }
    if (options.verbose) {
        args.push('--verbose');
    }

    const result = await runCommand(process.execPath, args);
    const success = result.stdout.includes('[SUCCESS] One-click test completed successfully!');

    return {
        mode: 'device-online',
        pluginRoot: path.relative(workspaceRoot, pluginRoot),
        success,
        commandExitCode: result.code,
        stdout: result.stdout,
        stderr: result.stderr
    };
}

module.exports = {
    runOfflineVerify,
    runOnlineVerify
};
