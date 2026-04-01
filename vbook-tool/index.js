#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Command } = require('commander');
const fs = require('fs');
const http = require('http');
const archiver = require('archiver');
const stringArgv = require('string-argv').default;
const { getLocalIP, sendRequest } = require('./utils');

const program = new Command();

program
  .name('vbook')
  .description('VBook Extension Helper Tool')
  .version('1.0.0');

/**
 * Common logic to find plugin root and metadata
 */
function getPluginInfo(targetPath) {
    let currentDir = path.resolve(targetPath || '.');
    
    // Check if plugin.json exists here
    if (!fs.existsSync(path.join(currentDir, 'plugin.json'))) {
        // If not found, and we are in 'vbook-tool' or 'src', try the parent
        const folderName = path.basename(currentDir);
        if (folderName === 'vbook-tool' || folderName === 'src') {
            currentDir = path.dirname(currentDir);
        }
    }
    
    const pluginJsonPath = path.join(currentDir, 'plugin.json');
    if (!fs.existsSync(pluginJsonPath)) {
        throw new Error(`plugin.json not found in ${currentDir} or its parent. Please run from the plugin root or tool directory.`);
    }
    
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    return {
        root: currentDir,
        name: path.basename(currentDir),
        json: pluginJson
    };
}

/**
 * DEBUG COMMAND
 */
program.command('debug')
  .description('Debug a script on the device')
  .argument('<file>', 'Path to the script to debug (e.g. src/home.js)')
  .option('-i, --ip <ip>', 'Device IP address')
  .option('-p, --port <port>', 'Device Port', '8080')
  .option('-in, --input <input>', 'Test input string')
  .action(async (file, options) => {
    let server = null;
    try {
        const fullPath = path.resolve(file);
        if (!fs.existsSync(fullPath)) return console.error(`File not found: ${fullPath}`);
        
        const info = getPluginInfo(path.dirname(fullPath));
        const ip = options.ip || process.env.VBOOK_IP;
        const port = parseInt(options.port || process.env.VBOOK_PORT || '8080');
        const localPort = parseInt(process.env.LOCAL_PORT || '8080');
        const localIP = getLocalIP();
        
        console.log(`[DEBUG] Target: ${ip}:${port}`);
        console.log(`[DEBUG] Local Server: http://${localIP}:${localPort}`);
        
        // Start local server to serve files to the device
        server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const fileName = url.searchParams.get('file');
            const rootName = url.searchParams.get('root');
            
            if (!fileName || !rootName) {
                res.writeHead(400);
                return res.end('Missing params');
            }
            
            // The app expects files from the root of the workspace
            // Mapping: requestedFilePath = SRC_PATH + root + file
            // In our case, info.root is the plugin folder. 
            // The extension logic: SRC_PATH = path.resolve(filePath, "../../../")
            // This is a bit complex in standalone tool. Let's simplify:
            // We assume the device wants files from the plugin's parent directory if root is provided.
            const workspaceRoot = path.dirname(info.root);
            const requestedPath = path.join(workspaceRoot, rootName, fileName);
            
            if (fs.existsSync(requestedPath)) {
                const content = fs.readFileSync(requestedPath);
                const base64 = content.toString('base64');
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(base64);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error(`[ERROR] Port ${localPort} is already in use. Please kill the process using this port or change LOCAL_PORT in .env`);
            } else {
                console.error(`[ERROR] Server error: ${e.message}`);
            }
            process.exit(1);
        });

        server.listen(localPort, localIP, () => {
            console.log(`[SERVER] Listening at http://${localIP}:${localPort}`);
        });

        // Prepare request
        const scriptContent = fs.readFileSync(fullPath, 'utf8');
        const inputStr = options.input || "";
        const input = inputStr ? stringArgv(inputStr) : [];
        
        const requestData = {
            input: input,
            ip: `http://${localIP}:${localPort}`,
            root: `${info.name}\\src`,
            language: "javascript",
            script: scriptContent
        };
        
        const base64Data = Buffer.from(JSON.stringify(requestData)).toString('base64');
        const headers = 
            `GET /test HTTP/1.1\r\n` +
            `Host: ${ip}:${port}\r\n` +
            `Connection: keep-alive\r\n` +
            `User-Agent: okhttp/3.12.6\r\n` +
            `Accept-Encoding: gzip\r\n` +
            `data: ${base64Data}\r\n\r\n`;
            
        console.log(`[TEST] Sending request for ${path.basename(file)}...`);
        const result = await sendRequest(ip, port, headers, options.verbose || process.env.VERBOSE === 'true');
        
        // Handle logs if present
        if (result && result.log) {
            console.log('[LOG FROM DEVICE]');
            // Replace \n with real newline as per extension logic
            const logStr = typeof result.log === 'string' ? result.log.replace(/\\n/g, '\n') : JSON.stringify(result.log, null, 2);
            console.log(logStr);
        }
        
        // Handle results or exceptions
        if (result && result.result) {
            try {
                let parsedResult = result.result;
                if (typeof parsedResult === 'string') {
                    try { parsedResult = JSON.parse(parsedResult); } catch(e) {}
                }
                console.log('[RESULT]', JSON.stringify(parsedResult, null, 2));
            } catch (e) {
                console.log('[RESULT]', result.result);
            }
        } else if (result && result.exception) {
            console.warn('[EXCEPTION FROM DEVICE]');
            const excStr = typeof result.exception === 'string' ? result.exception.replace(/\\n/g, '\n') : JSON.stringify(result.exception, null, 2);
            console.warn(excStr);
        } else {
            // If result is the whole response (no .result field)
            console.log('[RESPONSE]', JSON.stringify(result, null, 2));
        }
        
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
    } finally {
        if (server) {
            server.close();
            // console.log('[SERVER] Stopped');
        }
    }
  });

/**
 * INSTALL COMMAND
 */
program.command('install')
  .description('Install the extension on the device')
  .option('-i, --ip <ip>', 'Device IP address')
  .option('-p, --port <port>', 'Device Port', '8080')
  .action(async (options) => {
    try {
        const info = getPluginInfo();
        const ip = options.ip || process.env.VBOOK_IP;
        const port = parseInt(options.port || process.env.VBOOK_PORT || '8080');
        
        const iconPath = path.join(info.root, 'icon.png');
        if (!fs.existsSync(iconPath)) throw new Error("icon.png not found");
        
        console.log(`[INSTALL] Installing ${info.name} to ${ip}:${port}...`);
        
        const metadata = { ...info.json.metadata };
        if (metadata.encrypt) delete metadata.encrypt;
        
        const data = {
            ...metadata,
            ...info.json.script,
            id: "debug-" + metadata.source,
            icon: `data:image/*;base64,${fs.readFileSync(iconPath).toString('base64')}`,
            enabled: true,
            debug: true,
            data: {}
        };
        
        const srcDir = path.join(info.root, 'src');
        const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            data.data[file] = fs.readFileSync(path.join(srcDir, file), 'utf8');
        }
        data.data = JSON.stringify(data.data);
        
        const base64Data = Buffer.from(JSON.stringify(data)).toString('base64');
        const headers = 
            `GET /install HTTP/1.1\r\n` +
            `Host: ${ip}:${port}\r\n` +
            `Connection: close\r\n` +
            `data: ${base64Data}\r\n\r\n`;
            
        const result = await sendRequest(ip, port, headers, options.verbose || process.env.VERBOSE === 'true');
        if (result.status === 0) {
            console.log('[SUCCESS] Extension installed successfully!');
        } else {
            console.log('[FAILED]', result.message || 'Unknown error');
        }
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
    }
  });

/**
 * BUILD COMMAND
 */
program.command('build')
  .description('Package the extension into a zip file')
  .action(async () => {
    try {
        const info = getPluginInfo();
        const zipPath = path.join(info.root, 'plugin.zip');
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`[BUILD] Done! Created ${zipPath} (${(archive.pointer() / 1024).toFixed(2)} KB)`);
        });

        archive.on('error', (err) => { throw err; });
        archive.pipe(output);

        const metadata = { ...info.json };
        if (metadata.metadata.encrypt) delete metadata.metadata.encrypt;
        
        archive.directory(path.join(info.root, 'src'), 'src');
        archive.file(path.join(info.root, 'icon.png'), { name: 'icon.png' });
        archive.append(JSON.stringify(metadata, null, 2), { name: 'plugin.json' });

        await archive.finalize();
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
    }
  });

/**
 * TEST ALL (One-Click Test)
 */
program.command('test-all')
  .description('Perform a one-click test (home -> script -> detail -> toc -> chap)')
  .option('-i, --ip <ip>', 'Device IP address')
  .option('-p, --port <port>', 'Device Port', '8080')
  .action(async (options) => {
    let server = null;
    try {
        const info = getPluginInfo();
        const ip = options.ip || process.env.VBOOK_IP;
        const port = parseInt(options.port || process.env.VBOOK_PORT || '8080');
        const localPort = parseInt(process.env.LOCAL_PORT || '8080');
        const localIP = getLocalIP();
        
        console.log(`[ONE-CLICK] Starting test for ${info.name}...`);
        
        server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const fileName = url.searchParams.get('file');
            const rootName = url.searchParams.get('root');
            const workspaceRoot = path.dirname(info.root);
            const requestedPath = path.join(workspaceRoot, rootName, fileName);
            if (fs.existsSync(requestedPath)) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(fs.readFileSync(requestedPath).toString('base64'));
            } else {
                res.writeHead(404); res.end('Not found');
            }
        });
        server.listen(localPort, localIP);

        const runTest = async (scriptName, input = []) => {
            const scriptPath = path.join(info.root, 'src', scriptName);
            if (!fs.existsSync(scriptPath)) throw new Error(`${scriptName} not found`);
            
            const data = {
                input,
                ip: `http://${localIP}:${localPort}`,
                root: `${info.name}\\src`,
                language: "javascript",
                script: fs.readFileSync(scriptPath, 'utf8')
            };
            const headers = `GET /test HTTP/1.1\r\nHost: ${ip}:${port}\r\nConnection: keep-alive\r\nUser-Agent: okhttp/3.12.6\r\nAccept-Encoding: gzip\r\data: ${Buffer.from(JSON.stringify(data)).toString('base64')}\r\n\r\n`;
            
            console.log(`\n>>> RUNNING: ${scriptName} (input: ${JSON.stringify(input)})`);
            const res = await sendRequest(ip, port, headers);
            if (res.exception) throw new Error(`Exception in ${scriptName}: ${res.exception}`);
            if (res.log) console.log(`[LOG]`, res.log);
            
            const result = typeof res.result === 'string' ? JSON.parse(res.result) : res;
            return result.data || result;
        };

        // 1. Home
        const homeData = await runTest('home.js');
        if (!homeData || !homeData.length) throw new Error("home.js returned no data");
        console.log(`[HOME] Got ${homeData.length} items`);

        // 2. Next Script (e.g. gen.js)
        const firstItem = homeData[0];
        const scriptName = firstItem.script;
        const genData = await runTest(scriptName, [firstItem.input]);
        if (!genData || !genData.length) throw new Error(`${scriptName} returned no data`);
        console.log(`[GEN] Got ${genData.length} items`);

        // 3. Detail
        const firstBook = genData[0];
        let detailUrl = firstBook.link;
        if (firstBook.host && !detailUrl.startsWith('http')) {
            detailUrl = (firstBook.host.endsWith('/') ? firstBook.host : firstBook.host + '/') + (detailUrl.startsWith('/') ? detailUrl.substring(1) : detailUrl);
        }
        const detailData = await runTest('detail.js', [detailUrl]);
        console.log(`[DETAIL] Got details for: ${detailData.name}`);

        // 4. TOC
        const tocData = await runTest('toc.js', [detailUrl]);
        if (!tocData || !tocData.length) throw new Error("toc.js returned no chapters");
        console.log(`[TOC] Got ${tocData.length} chapters`);

        // 5. Chap
        const firstChap = tocData[0];
        let chapUrl = firstChap.url;
        if (firstChap.host && !chapUrl.startsWith('http')) {
            chapUrl = (firstChap.host.endsWith('/') ? firstChap.host : firstChap.host + '/') + (chapUrl.startsWith('/') ? chapUrl.substring(1) : chapUrl);
        }
        const chapData = await runTest('chap.js', [chapUrl]);
        console.log(`[CHAP] Content length: ${chapData ? chapData.length : 0} chars`);

        console.log("\n[SUCCESS] One-click test completed successfully!");
    } catch (error) {
        console.error(`\n[ERROR] ${error.message}`);
    } finally {
        if (server) server.close();
    }
  });

process.on('SIGINT', () => {
    // Graceful exit will trigger finally blocks if we weren't just in the action
    process.exit(0);
});

program.parse(process.argv);
