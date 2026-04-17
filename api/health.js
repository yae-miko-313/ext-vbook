const { getSnapshot, writeJson, handlePreflight } = require('./_lib/live-catalog');

/**
 * API Endpoint: /api/health
 * 
 * Performs a dynamic health check on extension sources.
 */
module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    try {
        const snapshot = await getSnapshot(req);
        const { catalog } = snapshot;

        // Simplify the output for the health check endpoint
        const health = {
            metadata: {
                timestamp: new Date().toISOString(),
                totalSources: catalog.sources.length,
                totalSites: Object.keys(catalog.siteHealth || {}).length
            },
            sources: catalog.sources.map(s => ({
                id: s.id,
                url: s.url,
                status: s.status,
                p: s.p,
                s: s.s,
                state: s.state,
                itemCount: s.itemCount
            })),
            sites: catalog.siteHealth || {}
        };

        return writeJson(req, res, health);
    } catch (error) {
        return writeJson(req, res, { error: error.message }, 500);
    }
};
