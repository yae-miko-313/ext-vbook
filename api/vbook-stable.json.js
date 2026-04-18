const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

/**
 * API for VBook Stable (legacy)
 * Supports pagination (paging) to handle the 199-item limit discovered for stable VBook.
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
        const { slim, limit, page } = req.query;
        const snapshot = await getSnapshot(req);
        
        // 1. Clean up Metadata
        const cleanMetadata = {
            author: snapshot.plugin.metadata.author || 'kychi',
            description: snapshot.plugin.metadata.description || 'VBook Extensions aggregate'
        };

        // 2. Determine limits
        // User tested and found the max limit for stable VBook is 199.
        const STABLE_MAX_LIMIT = 199;
        
        let maxItems = STABLE_MAX_LIMIT;
        if (slim === 'true') {
            maxItems = 10;
        } else if (limit) {
            maxItems = Math.min(parseInt(limit, 10) || STABLE_MAX_LIMIT, STABLE_MAX_LIMIT);
        }

        // 3. Handle Pagination
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        
        // 4. Process Data
        let allExtensions = snapshot.plugin.data || [];
        
        const start = (pageNum - 1) * maxItems;
        const end = start + maxItems;
        const pagedExtensions = allExtensions.slice(start, end);

        const cleanData = pagedExtensions.map(item => {
            const out = { ...item };
            if (out.path && !out.link) {
                out.link = out.path;
            }
            return out;
        });

        const responseData = {
            metadata: {
                ...cleanMetadata,
                // Helpful hints for the user (not used by VBook app)
                _totalItems: allExtensions.length,
                _currentPage: pageNum,
                _totalPages: Math.ceil(allExtensions.length / maxItems),
                _itemsPerPage: maxItems
            },
            data: cleanData
        };

        // Headers for debugging
        res.setHeader('X-Total-Items', allExtensions.length);
        res.setHeader('X-Current-Page', pageNum);
        res.setHeader('X-Items-Per-Page', maxItems);

        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        writeJson(req, res, responseData, 200, { 'Cache-Control': SWR_HEADER });
    } catch (error) {
        console.error('[API] Stable compatibility error:', error);
        writeJson(req, res, { error: error.message || 'Internal Server Error' }, 500);
    }
};
