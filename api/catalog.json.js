const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';

module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) {
        return;
    }

    if (req.method !== 'GET') {
        writeJson(req, res, { error: 'Method Not Allowed' }, 405);
        return;
    }

    try {
        // Use the Tiered-Cached getSnapshot (Memory -> KV -> Background Revalidation)
        const snapshot = await getSnapshot(req);
        
        // Return full snapshot as expected by the frontend
        const responseData = {
            plugin: snapshot.plugin,
            catalog: snapshot.catalog,
            sourceList: snapshot.sourceList
        };

        // Cache Control for Edge
        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        writeJson(req, res, responseData, 200, { 'Cache-Control': SWR_HEADER });
    } catch (error) {
        console.error('[API] Error in catalog handler:', error);
        writeJson(req, res, { error: error && error.message ? error.message : 'Internal Server Error' }, 500);
    }
};
