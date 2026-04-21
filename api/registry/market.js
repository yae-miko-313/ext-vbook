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
        const { limit = 50, page = 0, q = '', sort = 'usage', order = 'desc' } = req.query || {};
        
        const from = page * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('manifests')
            .select('id, slug, title, author, description, usage_count, updated_at, extension_ids')
            .eq('is_public', true)
            .eq('status', 'active');

        // 1. Search Logic
        if (q) {
            query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
        }

        // 2. Sorting Logic
        const sortColumn = {
            usage: 'usage_count',
            newest: 'updated_at',
            title: 'title'
        }[sort] || 'usage_count';

        query = query.order(sortColumn, { ascending: order === 'asc' });

        // Secondary sort for stability
        if (sortColumn !== 'updated_at') {
            query = query.order('updated_at', { ascending: false });
        }

        const { data, error } = await query.range(from, to);

        if (error) throw error;

        // Add ext_count from extension_ids array length
        const enriched = (data || []).map(item => ({
            ...item,
            ext_count: Array.isArray(item.extension_ids) ? item.extension_ids.length : 0
        }));

        return writeJson(req, res, { 
            success: true, 
            data: enriched
        }, 200, {
            'Cache-Control': 's-maxage=60, stale-while-revalidate=300' // Cache for 1 min on edge
        });

    } catch (err) {
        console.error('[API Registry Market] Error:', err.message);
        return writeJson(req, res, { error: err.message }, 500);
    }
};
