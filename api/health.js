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
                total: sourceResults.length,
                ok: sourceResults.filter(s => s.status === 'active').length,
                error: sourceResults.filter(s => s.status === 'error').length
            },
            sources: sourceResults.map(s => ({
                id: s.id,
                url: s.url,
                status: s.status,
                error: s.error || null,
                itemCount: s.itemCount
            }))
        };

        return writeJson(req, res, health);
    } catch (error) {
        return writeJson(req, res, { error: error.message }, 500);
    }
};
