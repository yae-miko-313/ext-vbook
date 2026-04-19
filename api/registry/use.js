'use strict';

const { supabase } = require('../_lib/supabase');
const { handlePreflight, writeJson } = require('../_lib/live-catalog');

/**
 * api/registry/use.js
 * Increments the usage_count for a manifest when a user copies the link.
 */
module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (req.method !== 'POST') {
        return writeJson(req, res, { error: 'Method not allowed' }, 405);
    }

    try {
        const { id } = req.body || {};

        if (!id) {
            return writeJson(req, res, { error: 'Manifest ID required' }, 400);
        }

        // Atomic increment using RPC is better, but since we are simple:
        // We use the postgres increment syntax.
        const { data, error } = await supabase.rpc('increment_usage', { manifest_id: id });

        // If RPC isn't available, we fallback to a simple update (less safe but works)
        if (error) {
            console.warn('[Usage API] RPC increment_usage failed, falling back to read-write:', error.message);
            
            const { data: current } = await supabase
                .from('manifests')
                .select('usage_count')
                .eq('id', id)
                .single();
            
            if (current) {
                await supabase
                    .from('manifests')
                    .update({ usage_count: (current.usage_count || 0) + 1 })
                    .eq('id', id);
            }
        }

        return writeJson(req, res, { success: true });

    } catch (err) {
        console.error('[API Registry Use] Error:', err.message);
        return writeJson(req, res, { error: err.message }, 500);
    }
};
