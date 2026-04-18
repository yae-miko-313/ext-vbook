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
 * Final VBook Stable Aggregate API
 * Strict Header (text/plain) and Strict 106KB limit.
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

        const cleanMetadata = {
            author: "kychi",
            description: "VBook Aggregate Part " + (shardIdx + 1)
        };

        const MAX_BYTES = 104 * 1024; // 104KB safety cap (limit is 106KB)
        const allExtensions = snapshot.plugin.data || [];
        
        const shardPool = allExtensions.filter(item => {
            const key = item.path || (item.name + item.author);
            return (getHash(key) % totalShards) === shardIdx;
        });

        let finalData = [];
        for (const item of shardPool) {
            const cleanItem = {
                name: String(item.name || ''),
                author: String(item.author || 'Anonymous'),
                path: String(item.path || ''), // Use 'path' for stable compatibility
                version: Math.floor(Number(item.version || 1)), // Strict Integer
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

        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        
        // CRITICAL: Stable app requires text/plain header to parse correctly
        writeJson(req, res, responseData, 200, { 
            'Cache-Control': SWR_HEADER,
            'Content-Type': 'text/plain; charset=utf-8' 
        });

    } catch (error) {
        console.error('[API] Final fix error:', error);
        writeJson(req, res, { error: 'Internal Error' }, 500);
    }
};
