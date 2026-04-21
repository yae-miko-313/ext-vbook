const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');
const { getStorageProvider } = require('./_lib/catalog-storage');

const REVALIDATION_SECRET = 'kychitoge1804@';

module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) {
        return;
    }

    const { secret, v } = req.query;

    if (secret !== REVALIDATION_SECRET) {
        writeJson(req, res, { error: 'Unauthorized: Invalid secret' }, 401);
        return;
    }

    try {
        const storage = getStorageProvider(req);
        const isBeta = v === 'beta';

        console.log(`[API] Revalidate: Deleting ${isBeta ? 'Supabase' : 'KV'} cache...`);
        await storage.del();

        console.log(`[API] Revalidate: Building fresh ${isBeta ? 'Beta' : 'Stable'} catalog snapshot...`);
        
        // This will trigger a fresh build and save it to the correct storage
        const snapshot = await getSnapshot(req);
        
        writeJson(req, res, { 
            message: `${isBeta ? 'Beta' : 'Stable'} cache invalidated and rebuilt successfully.`, 
            timestamp: new Date().toISOString() 
        }, 200);
    } catch (error) {
        console.error('[API] Error in revalidate handler:', error);
        writeJson(req, res, { error: error && error.message ? error.message : 'Internal Server Error' }, 500);
    }
};
