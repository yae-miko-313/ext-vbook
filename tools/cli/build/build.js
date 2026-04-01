const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function buildExtensionZip(workspaceRoot, pluginPath, dryRun = false) {
    const resolvedPath = path.resolve(workspaceRoot, pluginPath);
    const stat = fs.statSync(resolvedPath);
    
    let extDir = resolvedPath;
    if (stat.isFile() && path.basename(resolvedPath) === 'plugin.json') {
        extDir = path.dirname(resolvedPath);
    }
    
    if (!fs.existsSync(extDir)) {
        throw new Error(`Extension directory not found: ${extDir}`);
    }
    
    const pluginJsonPath = path.join(extDir, 'plugin.json');
    if (!fs.existsSync(pluginJsonPath)) {
        throw new Error(`plugin.json not found in: ${extDir}`);
    }
    
    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    const metadata = plugin.metadata || {};
    
    const srcDir = path.join(extDir, 'src');
    const iconPath = path.join(extDir, 'icon.png');
    const zipPath = path.join(extDir, 'plugin.zip');
    
    if (!fs.existsSync(srcDir)) {
        throw new Error(`src/ directory not found in: ${extDir}`);
    }
    
    const planned = {
        extDir: path.relative(workspaceRoot, extDir),
        zipPath: path.relative(workspaceRoot, zipPath),
        name: metadata.name || path.basename(extDir),
        version: metadata.version || 1,
        dryRun
    };
    
    if (dryRun) {
        return {
            success: true,
            built: false,
            ...planned
        };
    }
    
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            const statZip = fs.statSync(zipPath);
            resolve({
                success: true,
                built: true,
                ...planned,
                size: statZip.size
            });
        });
        
        output.on('error', (err) => {
            reject(new Error(`Failed to create zip: ${err.message}`));
        });
        
        archive.on('error', (err) => {
            reject(new Error(`Archive error: ${err.message}`));
        });
        
        archive.pipe(output);
        
        // Add src directory (entire) and icon.png (if exists)
        archive.directory(srcDir, 'src');
        if (fs.existsSync(iconPath)) {
            archive.file(iconPath, { name: 'icon.png' });
        }
        
        archive.finalize();
    });
}

module.exports = {
    buildExtensionZip
};
