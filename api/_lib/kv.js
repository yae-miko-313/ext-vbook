const { kv } = require('@vercel/kv');

const CATALOG_KEY = 'vbook:catalog:v3';

/**
 * Get cached catalog from Vercel KV
 */
async function getCachedCatalog() {
    try {
        return await kv.get(CATALOG_KEY);
    } catch (error) {
        console.error('[KV] Error fetching catalog:', error);
        return null; // Fallback to live fetch
    }
}

/**
 * Save catalog to Vercel KV
 */
async function setCachedCatalog(catalog) {
    try {
        // We store it for a long time in KV, as Edge Cache handles the short-term expiration
        await kv.set(CATALOG_KEY, catalog);
        return true;
    } catch (error) {
        console.error('[KV] Error saving catalog:', error);
        return false;
    }
}

/**
 * Clear the KV cache for revalidation
 */
async function clearCachedCatalog() {
    try {
        await kv.del(CATALOG_KEY);
        return true;
    } catch (error) {
        console.error('[KV] Error clearing cache:', error);
        return false;
    }
}

module.exports = {
    getCachedCatalog,
    setCachedCatalog,
    clearCachedCatalog,
    CATALOG_KEY
};
