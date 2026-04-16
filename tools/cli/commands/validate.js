const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

async function handleValidateCommand(options, workspaceRoot) {
    const pluginPath = options.plugin || 'extensions/novel/kychi_ntruyen';
    const resolvedPath = path.resolve(workspaceRoot, pluginPath);
    const srcDir = path.join(resolvedPath, 'src');

    if (!fs.existsSync(srcDir)) {
        console.error(`[ERROR] src/ directory not found in ${pluginPath}`);
        return false;
    }

    console.log(`\nVBook Extension Validation: ${pluginPath}`);
    console.log('=========================================');

    let overallSuccess = true;
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const filePath = path.join(srcDir, file);
        const code = fs.readFileSync(filePath, 'utf8');
        console.log(`\nChecking ${file}...`);

        // 1. AST Validation for ES5/Rhino compatibility
        try {
            acorn.parse(code, { ecmaVersion: 5 });
            console.log(`  ✓ Syntax: ES5 compatible.`);
        } catch (err) {
            console.warn(`  ✗ Syntax Error (ES5 incompatible at ${err.loc.line}:${err.loc.column}): ${err.message}`);
            overallSuccess = false;
        }

        // 2. VBook API Pattern Checks
        if (!code.includes('function execute')) {
            console.warn(`  ✗ Missing 'function execute(...)' entry point.`);
            overallSuccess = false;
        } else {
            console.log(`  ✓ Found 'execute' function.`);
        }

        if (code.includes('const ') || code.includes('let ')) {
            console.warn(`  ! Warning: 'const/let' detected. Ensure your Rhino runtime supports them.`);
        }
    }

    if (overallSuccess) {
        console.log('\n[SUCCESS] Extension is valid and ready for VBook.');
    } else {
        console.warn('\n[ISSUE] Validation failed. Please fix the items above.');
    }

    return overallSuccess;
}

module.exports = { handleValidateCommand };
