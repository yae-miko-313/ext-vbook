const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

/**
 * FULL Manifest Test (No size capping)
 * To test if the stable app can handle a ~220KB payload.
 */
module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) return;

    try {
        const snapshot = await getSnapshot(req);
        const allExtensions = snapshot.plugin.data || [];

        const cleanData = allExtensions.map(item => ({
            name: String(item.name || ''),
            author: String(item.author || 'Anonymous'),
            path: String(item.path || ''),
            version: Math.floor(Number(item.version || 1)),
            source: String(item.source || ''),
            icon: String(item.icon || ''),
            description: String(item.description || ''),
            type: String(item.type || 'novel'),
            locale: String(item.locale || 'vi_VN')
        }));

        const responseData = {
            metadata: {
                author: "kychi",
                description: "Full Aggregate Test (Uncapped)"
            },
            data: cleanData
        };

        const SWR_HEADER = 'public, s-maxage=3600, stale-while-revalidate=86400';
        
        writeJson(req, res, responseData, 200, { 
            'Cache-Control': SWR_HEADER,
            'Content-Type': 'text/plain; charset=utf-8' 
        });

    } catch (error) {
        res.status(500).send('Error');
    }
};
