const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');
const { clearCachedCatalog, setCachedCatalog } = require('./_lib/kv');

const REVALIDATION_SECRET = 'kychitoge1804@';

module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) {
        return;
    }

    const { secret } = req.query;

    if (secret !== REVALIDATION_SECRET) {
        writeJson(req, res, { error: 'Unauthorized: Invalid secret' }, 401);
        return;
    }

    try {
        console.log('[API] Revalidate: Deleting KV cache...');
        await clearCachedCatalog();

        // Background rebuild: Trigger the fetch and update KV
        // Note: For Serverless, we should ideally await to ensure it completes, 
        // but to provide a fast user experience, we can return the response slightly earlier 
        // if the environment supports it. Here, we'll await the rebuild to be safe and ensure data is fresh.
        console.log('[API] Revalidate: Building fresh catalog snapshot...');
        
        const snapshot = await getSnapshot(req);
        await setCachedCatalog(snapshot.catalog);

        console.log('[API] Revalidate: Success!');
        
        writeJson(req, res, { 
            message: 'Cache invalidated and rebuilt successfully.', 
            timestamp: new Date().toISOString() 
        }, 200);
    } catch (error) {
        console.error('[API] Error in revalidate handler:', error);
        writeJson(req, res, { error: error && error.message ? error.message : 'Internal Server Error' }, 500);
    }
};
