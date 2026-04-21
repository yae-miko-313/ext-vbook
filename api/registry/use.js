'use strict';

const { supabase } = require('../_lib/supabase');
const { handlePreflight, writeJson } = require('../_lib/live-catalog');

/**
 * api/registry/use.js
 * Increments the usage_count for a shelf when a user 'clones' or 'uses' it.
 */
module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (req.method !== 'POST') {
        return writeJson(req, res, { error: 'Method not allowed' }, 405);
    }

    try {
        const { slug, id } = req.body || {};

        if (!slug && !id) {
            return writeJson(req, res, { error: 'Slug or ID is required' }, 400);
        }

        const query = supabase.from('manifests').select('id, usage_count');
        if (id) query.eq('id', id);
        else query.eq('slug', slug);

        const { data: existing, error: fetchError } = await query.single();

        if (fetchError || !existing) {
            return writeJson(req, res, { error: 'Shelf not found' }, 404);
        }

        const { error: updateError } = await supabase
            .from('manifests')
            .update({ usage_count: (existing.usage_count || 0) + 1 })
            .eq('id', existing.id);

        if (updateError) throw updateError;

        return writeJson(req, res, { success: true, new_usage: (existing.usage_count || 0) + 1 });

    } catch (err) {
        console.error('[API Registry Use] Error:', err.message);
        return writeJson(req, res, { error: err.message }, 500);
    }
};
