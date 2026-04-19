'use strict';

const { supabase } = require('../_lib/supabase');
const { handlePreflight, writeJson } = require('../_lib/live-catalog');

/**
 * api/registry/market.js
 * Lists public custom manifests ranked by usage.
 */
module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    try {
        const { limit = 50, page = 0 } = req.query || {};
        
        const from = page * limit;
        const to = from + limit - 1;

        const { data, error } = await supabase
            .from('manifests')
            .select('id, slug, title, author, description, usage_count, updated_at')
            .eq('is_public', true)
            .eq('status', 'active')
            .order('usage_count', { ascending: false })
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return writeJson(req, res, { 
            success: true, 
            data: data || [] 
        }, 200, {
            'Cache-Control': 's-maxage=60, stale-while-revalidate=300' // Cache for 1 min on edge
        });

    } catch (err) {
        console.error('[API Registry Market] Error:', err.message);
        return writeJson(req, res, { error: err.message }, 500);
    }
};
