const {
    handlePreflight,
    getSnapshot,
    writeJson
} = require('./_lib/live-catalog');

module.exports = async function handler(req, res) {
    if (handlePreflight(req, res)) {
        return;
    }

    if (req.method !== 'GET') {
        writeJson(req, res, { error: 'Method Not Allowed' }, 405);
        return;
    }

    try {
        const snapshot = await getSnapshot(req);
        writeJson(req, res, snapshot.plugin, 200);
    } catch (error) {
        writeJson(req, res, { error: error && error.message ? error.message : 'Internal Server Error' }, 500);
    }
};
