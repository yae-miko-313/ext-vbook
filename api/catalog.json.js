const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');
const { getCachedCatalog, setCachedCatalog } = require('./_lib/kv');

const SWR_HEADER = 's-maxage=21600, stale-while-revalidate=21600'; // 6 hours

module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) {
        return;
    }

    if (req.method !== 'GET') {
        writeJson(req, res, { error: 'Method Not Allowed' }, 405);
        return;
    }

    try {
        // 1. Try to get from KV Storage first (Fast Path)
        const cached = await getCachedCatalog();
        
        if (cached) {
            console.log('[API] Cache HIT (KV)');
            writeJson(req, res, cached, 200, { 'Cache-Control': SWR_HEADER });
            return;
        }

        // 2. Cache MISS: Fetch live data
        console.log('[API] Cache MISS (KV). Fetching live...');
        const snapshot = await getSnapshot(req);
        const catalogData = snapshot.catalog;

        // 3. Update KV Storage (Async, don't block response if possible, but for MISS we wait)
        await setCachedCatalog(catalogData);

        // 4. Return with Edge Cache headers
        writeJson(req, res, catalogData, 200, { 'Cache-Control': SWR_HEADER });
    } catch (error) {
        console.error('[API] Error in catalog handler:', error);
        writeJson(req, res, { error: error && error.message ? error.message : 'Internal Server Error' }, 500);
    }
};
