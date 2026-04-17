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
        const { sourceResults } = snapshot;

        // Simplify the output for the health check
        const health = {
            metadata: {
                timestamp: new Date().toISOString(),
                totalSources: sourceResults.length,
                totalSites: Object.keys(snapshot.catalog.siteHealth || {}).length,
                okSources: sourceResults.filter(s => s.status === 'active').length,
                errorSources: sourceResults.filter(s => s.status === 'error').length
            },
            sources: sourceResults.map(s => ({
                id: s.id,
                url: s.url,
                status: s.status,
                state: s.state,
                confidence: s.confidence,
                evidence: s.evidence,
                finalHost: s.finalHost,
                itemCount: s.itemCount
            })),
            sites: snapshot.catalog.siteHealth || {}
        };

        return writeJson(req, res, health);
    } catch (error) {
        return writeJson(req, res, { error: error.message }, 500);
    }
};
