const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

/**
 * API for VBook Stable (legacy)
 * Discovered limit: 106KB JSON size.
 * Uses strict structural matching (Metadata only has author/description)
 * and iterative size capping to stay under 100KB for safety.
 */
module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) return;
    if (req.method !== 'GET') {
        writeJson(req, res, { error: 'Method Not Allowed' }, 405);
        return;
    }

    try {
        const { limit, page } = req.query;
        const snapshot = await getSnapshot(req);
        
        // 1. Strict Metadata (ONLY author and description as in GitHub's working file)
        const cleanMetadata = {
            author: snapshot.plugin.metadata.author || 'kychi',
            description: snapshot.plugin.metadata.description || 'VBook Extensions aggregate'
        };

        // 2. Determine sharding parameters
        const MAX_BYTES = 100 * 1024; // 100KB safety limit (User found 106KB)
        const DEFAULT_PAGE_SIZE = 100; // Start with 100 items per page
        
        const pageSize = parseInt(limit, 10) || DEFAULT_PAGE_SIZE;
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const allExtensions = snapshot.plugin.data || [];
        const startIndex = (pageNum - 1) * pageSize;

        // 3. Dynamic Bit-Rate/Size Sharding logic
        let finalData = [];
        let finalSize = 0;

        for (let i = startIndex; i < allExtensions.length; i++) {
            // Stop if we hit the requested limit for this page
            if (finalData.length >= pageSize) break;

            const item = { ...allExtensions[i] };
            // Ensure compatibility fields
            if (item.path && !item.link) item.link = item.path;

            // Check if adding this item exceeds the 100KB limit
            const nextData = [...finalData, item];
            const testPayload = { metadata: cleanMetadata, data: nextData };
            const testJson = JSON.stringify(testPayload, null, 2);
            const testSize = Buffer.byteLength(testJson, 'utf8');

            if (testSize > MAX_BYTES) {
                // If we already have items, stop here. 
                // If the FIRST item by itself is too big (unlikely), we still stop to prevent 500.
                break; 
            }

            finalData = nextData;
            finalSize = testSize;
        }

        const responseData = {
            metadata: cleanMetadata,
            data: finalData
        };

        // Custom headers for user debugging (hidden from VBook UI)
        res.setHeader('X-Total-Extensions', allExtensions.length);
        res.setHeader('X-Items-Count', finalData.length);
        res.setHeader('X-Payload-Size-KB', (finalSize / 1024).toFixed(2));

        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        writeJson(req, res, responseData, 200, { 'Cache-Control': SWR_HEADER });
    } catch (error) {
        console.error('[API] Stable compatibility error:', error);
        writeJson(req, res, { error: error.message || 'Internal Server Error' }, 500);
    }
};
