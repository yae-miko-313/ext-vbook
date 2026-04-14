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

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(WORKSPACE_ROOT, '.env') });

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

program.parse(process.argv);
