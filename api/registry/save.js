'use strict';

const { supabase } = require('../_lib/supabase');
const { handlePreflight, writeJson } = require('../_lib/live-catalog');
const crypto = require('crypto');

/**
 * api/registry/save.js
 * Handles creating or updating a custom extension shelf.
 */
module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (req.method !== 'POST') {
        return writeJson(req, res, { error: 'Method not allowed' }, 405);
    }

    try {
        const {
            id,             // Optional: UUID of the manifest to update
            secret_token,   // Required for existing manifests
            title,
            author,
            description,
            extension_ids,  // Array of strings
            is_public
        } = req.body || {};

        if (!title || !author || !Array.isArray(extension_ids) || extension_ids.length === 0) {
            return writeJson(req, res, { error: 'Missing required fields: title, author, or extension_ids' }, 400);
        }

        const now = new Date().toISOString();

        // --- UPDATE FLOW ---
        if (id) {
            if (!secret_token) {
                return writeJson(req, res, { error: 'Secret token is required to update a manifest' }, 401);
            }

            const { data: existing, error: checkError } = await supabase
                .from('manifests')
                .select('secret_token')
                .eq('id', id)
                .single();

            if (checkError || !existing) {
                return writeJson(req, res, { error: 'Manifest not found' }, 404);
            }

            if (existing.secret_token !== secret_token) {
                return writeJson(req, res, { error: 'Invalid secret token' }, 403);
            }

            const { data, error } = await supabase
                .from('manifests')
                .update({
                    title,
                    author,
                    description,
                    extension_ids,
                    is_public: is_public !== undefined ? is_public : true,
                    updated_at: now,
                    last_accessed_at: now,
                    status: 'active' // Resets frozen state if owner edits
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return writeJson(req, res, { success: true, data });
        }

        // --- CREATE FLOW ---
        // Generate a human-friendly slug
        const randomStr = crypto.randomBytes(4).toString('hex'); // 8 chars
        const slug = `vbook-${randomStr}`.replace(/\s+/g, '-');
        const newSecret = crypto.randomUUID();

        const { data, error } = await supabase
            .from('manifests')
            .insert({
                slug,
                title,
                author,
                description,
                extension_ids,
                is_public: is_public !== undefined ? is_public : true,
                secret_token: newSecret,
                created_at: now,
                updated_at: now,
                last_accessed_at: now,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;

        return writeJson(req, res, {
            success: true,
            data: {
                id: data.id,
                slug: data.slug,
                secret_token: data.secret_token // ONLY returned on creation
            }
        });

    } catch (err) {
        console.error('[API Registry Save] Error:', err.message);
        return writeJson(req, res, { error: err.message }, 500);
    }
};
