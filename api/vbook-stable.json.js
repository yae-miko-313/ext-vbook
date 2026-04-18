const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

/**
 * API for VBook Stable (legacy)
 * Discovered limit: ~108KB JSON size.
 * Uses iterative size capping to stay within the limit.
 */
module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) return;
    if (req.method !== 'GET') {
        writeJson(req, res, { error: 'Method Not Allowed' }, 405);
        return;
    }

    try {
        const { slim, limit, page } = req.query;
        const snapshot = await getSnapshot(req);
        
        const cleanMetadata = {
            author: snapshot.plugin.metadata.author || 'kychi',
            description: snapshot.plugin.metadata.description || 'VBook Extensions aggregate'
        };

        // User discovered ~108KB threshold. 
        // We set hard limit at 100KB for safety.
        const MAX_BYTES = 100 * 1024; 
        const DEFAULT_CHUNK_SIZE = 60; // Start with 60 items

        let pageSize = parseInt(limit, 10) || DEFAULT_CHUNK_SIZE;
        if (slim === 'true') pageSize = 10;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const allExtensions = snapshot.plugin.data || [];
        const startIndex = (pageNum - 1) * pageSize;

        // Iterate and add items one by one until size limit is hit
        let finalData = [];
        let currentSize = 0;

        for (let i = startIndex; i < Math.min(startIndex + 200, allExtensions.length); i++) {
            const item = { ...allExtensions[i] };
            if (item.path && !item.link) item.link = item.path;

            const nextData = [...finalData, item];
            const estimatedJson = JSON.stringify({ metadata: cleanMetadata, data: nextData });
            currentSize = Buffer.byteLength(estimatedJson, 'utf8');

            if (currentSize > MAX_BYTES) break;
            finalData = nextData;
        }

        const responseData = {
            metadata: {
                ...cleanMetadata,
                _sharding: {
                    totalItems: allExtensions.length,
                    page: pageNum,
                    pageSize: finalData.length,
                    payloadSizeKb: (currentSize / 1024).toFixed(2)
                }
            },
            data: finalData
        };

        res.setHeader('X-Payload-Size-KB', (currentSize / 1024).toFixed(2));
        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        writeJson(req, res, responseData, 200, { 'Cache-Control': SWR_HEADER });
    } catch (error) {
        console.error('[API] Stable compatibility error:', error);
        writeJson(req, res, { error: error.message || 'Internal Server Error' }, 500);
    }
};
