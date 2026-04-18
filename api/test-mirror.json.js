const fs = require('fs');
const path = require('path');
const { handlePreflight, writeJson } = require('./_lib/live-catalog');

/**
 * Pure byte-for-byte mirror of the working plugin.json
 */
module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) return;
    
    try {
        const filePath = path.join(process.cwd(), 'plugin.json');
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        // Mirror headers as closely as possible
        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        writeJson(req, res, data, 200, { 
            'Cache-Control': SWR_HEADER,
            'Content-Type': 'text/plain; charset=utf-8' // GitHub uses text/plain
        });
    } catch (error) {
        res.status(500).send('Error');
    }
};
