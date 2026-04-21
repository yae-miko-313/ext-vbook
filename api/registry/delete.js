'use strict';

const { supabase } = require('../_lib/supabase');
const { handlePreflight, writeJson } = require('../_lib/live-catalog');

/**
 * api/registry/delete.js
 * Deletes a custom extension shelf if the correct secret_token is provided.
 */
module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (req.method !== 'POST' && req.method !== 'DELETE') {
        return writeJson(req, res, { error: 'Method not allowed' }, 405);
    }

    try {
        const { id, secret_token } = req.body || req.query || {};

        if (!id || !secret_token) {
            return writeJson(req, res, { error: 'ID and secret_token are required' }, 400);
        }

        // 1. Verify ownership
        const { data: existing, error: checkError } = await supabase
            .from('manifests')
            .select('secret_token')
            .eq('id', id)
            .single();

        if (checkError || !existing) {
            return writeJson(req, res, { error: 'Manifest not found' }, 404);
        }

        if (existing.secret_token !== secret_token) {
            return writeJson(req, res, { error: 'Unauthorized: Invalid secret token' }, 403);
        }

        // 2. Perform deletion
        const { error: deleteError } = await supabase
            .from('manifests')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return writeJson(req, res, { success: true, message: 'Shelf deleted successfully' });

    } catch (err) {
        console.error('[API Registry Delete] Error:', err.message);
        return writeJson(req, res, { error: err.message }, 500);
    }
};
