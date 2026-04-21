'use strict';

/**
 * api/_lib/catalog-storage.js
 * Unified Storage Provider for Catalog Snapshots
 * Supports Vercel KV (Stable) and Supabase (Beta)
 */

const { kv } = require('@vercel/kv');
const { supabase } = require('./supabase');

const SNAPSHOT_KEY_STABLE = 'vbook:full_snapshot_v4';
const SNAPSHOT_KEY_BETA = 'catalog_v3'; // Stored in app_cache table

/**
 * KV-based Provider (Stable)
 */
const kvProvider = {
    async get() {
        try {
            return await kv.get(SNAPSHOT_KEY_STABLE);
        } catch (error) {
            console.error('[Storage KV] Get Error:', error);
            return null;
        }
    },
    async set(data) {
        try {
            await kv.set(SNAPSHOT_KEY_STABLE, data);
            return true;
        } catch (error) {
            console.error('[Storage KV] Set Error:', error);
            return false;
        }
    },
    async del() {
        try {
            await kv.del(SNAPSHOT_KEY_STABLE);
            return true;
        } catch (error) {
            console.error('[Storage KV] Del Error:', error);
            return false;
        }
    }
};

/**
 * Supabase-based Provider (Beta)
 */
const supabaseProvider = {
    async get() {
        try {
            const { data, error } = await supabase
                .from('app_cache')
                .select('value')
                .eq('key', SNAPSHOT_KEY_BETA)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }
            return data.value;
        } catch (error) {
            console.error('[Storage Supabase] Get Error:', error);
            return null;
        }
    },
    async set(data) {
        try {
            const { error } = await supabase
                .from('app_cache')
                .upsert({ 
                    key: SNAPSHOT_KEY_BETA, 
                    value: data,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[Storage Supabase] Set Error:', error);
            return false;
        }
    },
    async del() {
        try {
            const { error } = await supabase
                .from('app_cache')
                .delete()
                .eq('key', SNAPSHOT_KEY_BETA);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[Storage Supabase] Del Error:', error);
            return false;
        }
    }
};

/**
 * Storage Bridge Factory
 * @param {Object} req - Vercel request object
 */
function getStorageProvider(req) {
    const isBeta = req === true || (req && (
        (req.query && req.query.v === 'beta') || 
        (req.headers && req.headers.referer && req.headers.referer.includes('/customizer'))
    ));

    return isBeta ? supabaseProvider : kvProvider;
}

module.exports = {
    getStorageProvider,
    SNAPSHOT_KEY_STABLE,
    SNAPSHOT_KEY_BETA
};
