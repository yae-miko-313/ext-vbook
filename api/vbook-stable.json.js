const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

/**
 * Deterministic string hash
 */
function getHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = (hash & hash);
    }
    return Math.abs(hash);
}

/**
 * Minimalist API for VBook Stable (legacy)
 * Matches GitHub's raw format as closely as possible.
 */
module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) return;
    if (req.method !== 'GET') {
        writeJson(req, res, { error: 'Method Not Allowed' }, 405);
        return;
    }

    try {
        const { shard, total } = req.query;
        const snapshot = await getSnapshot(req);
        
        const shardIdx = parseInt(shard, 10) || 0;
        const totalShards = Math.max(parseInt(total, 10) || 1, 1);

        // 1. Minimalist Metadata (Absolute basic strings, no special symbols)
        const cleanMetadata = {
            author: "kychi",
            description: "VBook Aggregate Part " + (shardIdx + 1)
        };

        // 2. Strict Sharding and Size Capping
        const MAX_BYTES = 100 * 1024; // 100KB
        const allExtensions = snapshot.plugin.data || [];
        
        const shardPool = allExtensions.filter(item => {
            const key = item.path || (item.name + item.author);
            return (getHash(key) % totalShards) === shardIdx;
        });

        let finalData = [];
        for (const item of shardPool) {
            // Releasing the exact fields from the working plugin.json
            const cleanItem = {
                name: String(item.name || ''),
                author: String(item.author || 'Anonymous'),
                path: String(item.path || ''), // Use 'path' not 'link'
                version: Number(item.version || 1),
                source: String(item.source || ''),
                icon: String(item.icon || ''),
                description: String(item.description || ''),
                type: String(item.type || 'novel'),
                locale: String(item.locale || 'vi_VN')
            };

            const nextData = [...finalData, cleanItem];
            const testPayload = { metadata: cleanMetadata, data: nextData };
            const testJson = JSON.stringify(testPayload, null, 2);
            
            if (Buffer.byteLength(testJson, 'utf8') > MAX_BYTES) break;
            finalData = nextData;
        }

        const responseData = {
            metadata: cleanMetadata,
            data: finalData
        };

        // Cache for 1 hour, revalidate for 1 day
        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        writeJson(req, res, responseData, 200, { 'Cache-Control': SWR_HEADER });
    } catch (error) {
        console.error('[API] Minimalist error:', error);
        writeJson(req, res, { error: 'Internal Error' }, 500);
    }
};
