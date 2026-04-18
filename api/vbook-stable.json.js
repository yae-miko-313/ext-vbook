const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

/**
 * API for VBook Stable (legacy)
 * Mimics GitHub's structure and includes "slim" mode to handle large catalogs.
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
        const { slim, limit } = req.query;
        const snapshot = await getSnapshot(req);
        
        // 1. Clean up Metadata
        const cleanMetadata = {
            author: snapshot.plugin.metadata.author || 'kychi',
            description: snapshot.plugin.metadata.description || 'VBook Extensions aggregate'
        };

        // 2. Determine limits
        // If ?slim=true, return 10. Otherwise default to 50 (max working known size)
        let maxItems = 50;
        if (slim === 'true') {
            maxItems = 10;
        } else if (limit) {
            maxItems = parseInt(limit, 10) || 50;
        }

        // 3. Process Data
        let extensions = snapshot.plugin.data || [];
        
        // Apply limit
        const limitedExtensions = extensions.slice(0, maxItems);

        const cleanData = limitedExtensions.map(item => {
            const out = { ...item };
            if (out.path && !out.link) {
                out.link = out.path;
            }
            return out;
        });

        const responseData = {
            metadata: cleanMetadata,
            data: cleanData
        };

        // Header for debugging
        res.setHeader('X-Total-Items', extensions.length);
        res.setHeader('X-Returned-Items', cleanData.length);

        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        writeJson(req, res, responseData, 200, { 'Cache-Control': SWR_HEADER });
    } catch (error) {
        console.error('[API] Stable compatibility error:', error);
        writeJson(req, res, { error: error.message || 'Internal Server Error' }, 500);
    }
};
