const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

/**
 * API for VBook Stable (legacy)
 * Mimics the exact structure of a raw GitHub plugin.json to ensure compatibility.
 * Returns { metadata, data } and excludes extra root fields like referenceListUrl.
 */
module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) {
        return;
    }

    if (req.method !== 'GET') {
        writeJson(req, res, { error: 'Method Not Allowed' }, 405);
        return;
    }

    try {
        const snapshot = await getSnapshot(req);
        
        // 1. Clean up Metadata (Strips generatedAt and other non-standard fields)
        const cleanMetadata = {
            author: snapshot.plugin.metadata.author || 'kychi',
            description: snapshot.plugin.metadata.description || 'VBook Extensions aggregate'
        };

        // 2. Clean up Data Items
        const cleanData = (snapshot.plugin.data || []).map(item => {
            const out = { ...item };
            
            // To be safe for all stable versions, ensure both "path" and "link" are present
            if (out.path && !out.link) {
                out.link = out.path;
            }
            
            // Note: We keep most fields but ensure absolute URLs are used (already done by getSnapshot)
            return out;
        });

        // 3. Construct Final Response (Strictly ONLY metadata and data)
        const responseData = {
            metadata: cleanMetadata,
            data: cleanData
        };

        // Cache for 1 hour
        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        writeJson(req, res, responseData, 200, { 'Cache-Control': SWR_HEADER });
    } catch (error) {
        console.error('[API] Stable compatibility error:', error);
        writeJson(req, res, { error: error.message || 'Internal Server Error' }, 500);
    }
};
