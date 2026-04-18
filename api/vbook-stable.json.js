const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

/**
 * Simple deterministic string hash function
 */
function getHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * API for VBook Stable (legacy)
 * Uses Stable Hashing Sharding to handle dynamic catalogs and size limits.
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
        
        // 1. Sharding parameters
        const shardIdx = parseInt(shard, 10) || 0;
        const totalShards = Math.max(parseInt(total, 10) || 1, 1);

        // 2. Strict Metadata with Unique Identification per Shard
        // We include the shard info in the description so the stable app treats them as unique sources.
        const cleanMetadata = {
            author: snapshot.plugin.metadata.author || 'kychi',
            description: `${snapshot.plugin.metadata.description || 'VBook Extensions'} (Shard ${shardIdx + 1}/${totalShards})`
        };

        // 3. HARD Byte Limit (safety)
        const MAX_BYTES = 100 * 1024; // 100KB safety limit
        
        // 4. Hashing and Sharding Logic
        const allExtensions = snapshot.plugin.data || [];
        
        // a. Filter by shard (Stable hashing)
        const shardData = [];
        for (const item of allExtensions) {
            const key = item.path || `${item.name}|${item.author}`;
            if ((getHash(key) % totalShards) === shardIdx) {
                shardData.push(item);
            }
        }

        // b. Final Cleaning and Size Capping
        let finalData = [];
        let finalSize = 0;

        for (const item of shardData) {
            const cleanItem = { ...item };
            // Ensure compatibility fields
            if (cleanItem.path && !cleanItem.link) cleanItem.link = cleanItem.path;
            
            // Strictly ONLY standard fields to avoid parser errors
            const standardItem = {
                name: cleanItem.name,
                author: cleanItem.author,
                description: cleanItem.description,
                link: cleanItem.link,
                icon: cleanItem.icon,
                version: cleanItem.version
            };

            const nextData = [...finalData, standardItem];
            const testPayload = { metadata: cleanMetadata, data: nextData };
            const testJson = JSON.stringify(testPayload, null, 2);
            const testSize = Buffer.byteLength(testJson, 'utf8');

            if (testSize > MAX_BYTES) break; // Hard size stop

            finalData = nextData;
            finalSize = testSize;
        }

        const responseData = {
            metadata: cleanMetadata,
            data: finalData
        };

        // Debug Headers
        res.setHeader('X-Shard-ID', shardIdx);
        res.setHeader('X-Total-Shards', totalShards);
        res.setHeader('X-Payload-Size-KB', (finalSize / 1024).toFixed(2));

        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        writeJson(req, res, responseData, 200, { 'Cache-Control': SWR_HEADER });
    } catch (error) {
        console.error('[API] Stable sharding error:', error);
        writeJson(req, res, { error: error.message || 'Internal Server Error' }, 500);
    }
};
