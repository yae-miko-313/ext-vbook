const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

/**
 * Deterministic string hash (for optional sharding)
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
 * Universal VBook Aggregate API (Legacy Stable & Modern Beta Compatible)
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
        const allExtensions = snapshot.plugin.data || [];
        
        // 1. Optional Sharding (Default to full list)
        let processedData = [];
        if (shard !== undefined && total !== undefined) {
            const shardIdx = parseInt(shard, 10) || 0;
            const totalShards = Math.max(parseInt(total, 10) || 1, 1);
            processedData = allExtensions.filter(item => {
                const key = item.path || (item.name + item.author);
                return (getHash(key) % totalShards) === shardIdx;
            });
        } else {
            processedData = allExtensions;
        }

        // 2. Strict Data Normalization (Compatible with ALL VBook versions)
        const finalData = processedData.map(item => ({
            name: String(item.name || ''),
            author: String(item.author || 'Anonymous'),
            path: String(item.path || ''),
            version: Math.floor(Number(item.version || 1)), // Use integer for stable app
            source: String(item.source || ''),
            icon: String(item.icon || ''),
            description: String(item.description || ''),
            type: String(item.type || 'novel'),
            locale: String(item.locale || 'vi_VN')
        }));

        const responseData = {
            metadata: {
                author: "kychi",
                description: snapshot.plugin.metadata.description || "VBook Aggregate Master Manifest"
            },
            data: finalData
        };

        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        
        // CRITICAL: Force text/plain header for universal compatibility (Stable & Beta)
        writeJson(req, res, responseData, 200, { 
            'Cache-Control': SWR_HEADER,
            'Content-Type': 'text/plain; charset=utf-8' 
        });

    } catch (error) {
        console.error('[API] Universal API Error:', error);
        writeJson(req, res, { error: 'Internal Error' }, 500);
    }
};
