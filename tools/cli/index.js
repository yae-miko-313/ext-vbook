#!/usr/bin/env node

const path = require('path');
const { Command } = require('commander');
const {
    scaffoldExtension,
    updateExistingExtension,
    askIfMissing
} = require('./scaffold/scaffold');
const { buildExtensionZip } = require('./build/build');
const { buildCatalog } = require('./build/build-catalog');
const {
    runDevicePing,
    runDeviceDebug,
    runDeviceInstall,
    runDeviceTestAll
} = require('./device/commands');

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(WORKSPACE_ROOT, '.env') });

if (!process.env.VBOOK_AUTHOR && process.env.author) {
    process.env.VBOOK_AUTHOR = process.env.author;
}

const program = new Command();

program
    .name('vbook')
    .description('VBook CLI - tao/sua/build extension nhanh')
    .version('2.1.0');

program.command('ext')
    .description('Tao moi hoac sua metadata extension')
    .option('--mode <mode>', 'create|edit', 'create')
    .option('--from-reference <path>', 'Thu muc tham chieu hoc tap (template plugin folder)', '.private/code-reference/_unknown/example')
    .option('--name <name>', 'Extension display name')
    .option('--folder <folder>', 'Output folder slug (create mode)')
    .option('--source <url>', 'Source website URL')
    .option('--type <type>', 'novel|comic|chinese_novel|translate|tts', 'novel')
    .option('--locale <locale>', 'vi_VN|zh_CN|en_US', 'vi_VN')
    .option('--author <author>', 'Metadata author')
    .option('--description <text>', 'Metadata description')
    .option('--regexp <regex>', 'Metadata regexp')
    .option('--template <path>', 'Template directory path (create mode)')
    .option('--output <path>', 'Output directory path (create mode)')
    .option('--force', 'Overwrite output if exists (create mode)')
    .option('--plugin <path>', 'Extension folder or plugin.json (edit mode)')
    .option('--version <n>', 'Set metadata.version (edit mode)')
    .option('--bump-version', 'Increase metadata.version by 1 (edit mode)')
    .option('--dry-run', 'Preview only, do not write file')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        try {
            const mode = String(options.mode || 'create').trim().toLowerCase();
            if (mode !== 'create' && mode !== 'edit') {
                throw new Error('--mode must be create or edit.');
            }

            let result;
            if (mode === 'create') {
                const interactiveConfig = { ...options };
                if (!interactiveConfig.template && interactiveConfig.fromReference) {
                    interactiveConfig.template = interactiveConfig.fromReference;
                }
                await askIfMissing(interactiveConfig, 'name', 'Extension name');
                await askIfMissing(interactiveConfig, 'source', 'Source URL (domain)');
                await askIfMissing(interactiveConfig, 'author', 'Author', process.env.VBOOK_AUTHOR || 'kychi');
                result = scaffoldExtension(WORKSPACE_ROOT, interactiveConfig);
            } else {
                result = updateExistingExtension(WORKSPACE_ROOT, options);
            }

            if (options.json) {
                console.log(JSON.stringify({
                    mode,
                    fromReference: options.fromReference,
                    ...result
                }, null, 2));
            } else {
                console.log('');
                console.log('VBook Extension Tool');
                console.log('====================');
                console.log(`Mode: ${mode}`);
                console.log(`Reference: ${options.fromReference}`);
                if (mode === 'create') {
                    console.log(`Name: ${result.name}`);
                    console.log(`Output: ${result.outputDir}`);
                    console.log(`Generated: ${result.generated ? 'yes' : 'no (dry-run)'}`);
                } else {
                    console.log(`Plugin: ${result.pluginPath}`);
                    console.log(`Updated: ${result.updated ? 'yes' : 'no'}`);
                    if (Array.isArray(result.changedFields) && result.changedFields.length > 0) {
                        console.log(`Fields: ${result.changedFields.join(', ')}`);
                    }
                    if (result.message) {
                        console.log(result.message);
                    }
                }
            }

            if (!result.success) {
                process.exitCode = 1;
            }
        } catch (error) {
            console.error(`[ERROR] ${error.message}`);
            process.exitCode = 1;
        }
    });

program.command('build')
    .description('Build extension to plugin.zip (plugin.json + src/ + icon.png)')
    .option('--plugin <path>', 'Extension folder or plugin.json path', 'extensions/novel/kychi_ntruyen')
    .option('--dry-run', 'Preview only, do not create zip')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        try {
            const result = await buildExtensionZip(WORKSPACE_ROOT, options.plugin, options.dryRun);
            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
            } else {
                console.log('');
                console.log('VBook Extension Build');
                console.log('====================');
                console.log(`Extension: ${result.extDir}`);
                console.log(`Zip: ${result.zipPath}`);
                console.log(`Name: ${result.name} (v${result.version})`);
                if (result.built) {
                    console.log(`Built: yes (${result.size} bytes)`);
                } else {
                    console.log(`Built: no (dry-run)`);
                }
            }
            if (!result.success) {
                process.exitCode = 1;
            }
        } catch (error) {
            console.error(`[ERROR] ${error.message}`);
            process.exitCode = 1;
        }
    });

program.command('build-catalog')
    .description('Rebuild extension catalog from extensions/ directory')
    .option('--json', 'Output as JSON')
    .action((options) => {
        try {
            const result = buildCatalog(WORKSPACE_ROOT);
            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
            } else {
                console.log('');
                console.log('VBook Catalog Build');
                console.log('===================');
                result.files.forEach(f => {
                    console.log(`  ${f.path}: ${f.count} entries`);
                });
                console.log(`\nTotal: ${result.total} extensions`);
                console.log(result.message);
            }
            if (!result.success) {
                process.exitCode = 1;
            }
        } catch (error) {
            console.error(`[ERROR] ${error.message}`);
            process.exitCode = 1;
        }
    });

program.command('device')
    .description('Debug/install extension on VBook device (TCP bridge)')
    .option('-i, --ip <ip>', 'Device IP address (default: VBOOK_IP)')
    .option('-p, --port <port>', 'Device port (default: VBOOK_PORT)', '8080')
    .option('--timeout-ms <n>', 'TCP timeout waiting for device response (default: 60000)', '60000')
    .option('--verbose', 'Verbose network logs')
    .addCommand(
        new Command('ping')
            .description('Check TCP connectivity to device')
            .action(async (...args) => {
                try {
                    const command = args[args.length - 1];
                    const opts = command.parent.opts();
                    const result = await runDevicePing(opts);
                    console.log(`[OK] Device reachable at ${result.ip}:${result.port}`);
                } catch (error) {
                    console.error(`[ERROR] ${error.message}`);
                    process.exitCode = 1;
                }
            })
    )
    .addCommand(
        new Command('debug')
            .description('Debug a script on the device')
            .argument('<file>', 'Path to the script (e.g. extensions/novel/kychi_ntruyen/src/home.js)')
            .option('-in, --input <input>', 'Input args string (e.g. "https://site/path" "2")')
            .action(async (file, subOptions, ...rest) => {
                try {
                    const command = rest[rest.length - 1];
                    const opts = { ...command.parent.opts(), ...subOptions };
                    const result = await runDeviceDebug(file, opts);

                    if (result.log) {
                        console.log('[LOG FROM DEVICE]');
                        const logStr = typeof result.log === 'string' ? result.log.replace(/\\n/g, '\n') : JSON.stringify(result.log, null, 2);
                        console.log(logStr);
                    }

                    if (result.exception) {
                        console.warn('[EXCEPTION FROM DEVICE]');
                        const excStr = typeof result.exception === 'string' ? result.exception.replace(/\\n/g, '\n') : JSON.stringify(result.exception, null, 2);
                        console.warn(excStr);
                        process.exitCode = 1;
                        return;
                    }

                    if (typeof result.result !== 'undefined') {
                        console.log('[RESULT]');
                        console.log(JSON.stringify(result.result, null, 2));
                    } else {
                        console.log('[RESPONSE]');
                        console.log(JSON.stringify(result.raw, null, 2));
                    }
                } catch (error) {
                    console.error(`[ERROR] ${error.message}`);
                    process.exitCode = 1;
                }
            })
    )
    .addCommand(
        new Command('install')
            .description('Install the extension on the device')
            .option('--plugin <path>', 'Extension folder path (default: current dir)')
            .action(async (subOptions, ...rest) => {
                try {
                    const command = rest[rest.length - 1];
                    const opts = { ...command.parent.opts(), ...subOptions };
                    const result = await runDeviceInstall(subOptions.plugin || '.', opts);
                    if (result.exception) {
                        console.warn('[FAILED]');
                        console.warn(typeof result.exception === 'string' ? result.exception : JSON.stringify(result.exception, null, 2));
                        process.exitCode = 1;
                        return;
                    }
                    console.log('[SUCCESS] Install request sent.');
                    if (result.result) {
                        console.log(JSON.stringify(result.result, null, 2));
                    }
                } catch (error) {
                    console.error(`[ERROR] ${error.message}`);
                    process.exitCode = 1;
                }
            })
    )
    .addCommand(
        new Command('test-all')
            .description('One-click test (home -> gen -> detail -> toc -> chap)')
            .option('--plugin <path>', 'Extension folder path (default: current dir)')
            .action(async (subOptions, ...rest) => {
                try {
                    const command = rest[rest.length - 1];
                    const opts = { ...command.parent.opts(), ...subOptions };
                    await runDeviceTestAll(subOptions.plugin || '.', opts);
                    console.log('[SUCCESS] One-click test completed successfully!');
                } catch (error) {
                    console.error(`[ERROR] ${error.message}`);
                    process.exitCode = 1;
                }
            })
    );

program.parse(process.argv);
