const {
    handlePreflight,
    getSourceList,
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
        const sourceList = getSourceList();
        writeJson(req, res, sourceList, 200);
    } catch (error) {
        writeJson(req, res, { error: error && error.message ? error.message : 'Internal Server Error' }, 500);
    }
};
