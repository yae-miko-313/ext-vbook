/**
 * api/registry/[slug].json.js
 * The real-time resolver that converts a custom shelf ID into a VBook-compatible manifest.
 */
'use strict';

const { supabase } = require('../_lib/supabase');
const { getSnapshot, handlePreflight } = require('../_lib/live-catalog');

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;
    // Vercel serverless handles [slug] in req.query
    const { slug } = req.query;

    if (!slug) {
        res.statusCode = 400;
        return res.end('Manifest slug required');
    }

    try {
        // 1. Fetch manifest definition from Supabase
        const cleanSlug = slug.replace('.json', '');
        const { data: manifest, error: dbError } = await supabase
            .from('manifests')
            .select('id, title, author, description, extension_ids, status, usage_count')
            .eq('slug', cleanSlug)
            .single();

        if (dbError || !manifest) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end(`VBook Error: Manifest "${cleanSlug}" not found or deleted.`);
        }

        if (manifest.status === 'frozen') {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end(`VBook Error: Manifest "${cleanSlug}" is frozen due to inactivity. Reactivate it at the dashboard.`);
        }

        // 2. Atomic update: last_accessed_at (keep it alive)
        // We MUST await this because Vercel serverless functions will terminate
        // outstanding network requests immediately after res.end().
        await supabase.from('manifests')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', manifest.id);

        // 3. Fetch current live catalog (Force Beta/Supabase)
        const snapshot = await getSnapshot(true);
        const allExtensions = snapshot.plugin?.data || [];
        
        // 4. Filter and Project
        // extension_ids in manifest can be paths or names. We'll match against both for robustness.
        const shelfIds = new Set(manifest.extension_ids || []);
        const filteredData = allExtensions.filter(ext => {
            return shelfIds.has(ext.path) || shelfIds.has(ext.name);
        });

        // 5. Construct VBook Manifest
        const responseData = {
            metadata: {
                name: manifest.title,
                author: manifest.author,
                description: manifest.description || 'VBook Custom Shelf',
                version: 1, // Metadata version
                generatedAt: new Date().toISOString(),
                totalItems: filteredData.length,
                usage: manifest.usage_count
            },
            data: filteredData.map(ext => ({
                name: String(ext.name || ''),
                author: String(ext.author || ''),
                path: String(ext.path || ''),
                version: parseInt(ext.version) || 1,
                source: String(ext.source || ''),
                icon: String(ext.icon || ''),
                description: String(ext.description || ''),
                type: String(ext.type || 'novel'),
                locale: String(ext.locale || 'vi')
            }))
        };

        // 6. Return with Legacy Headers for Stable App Compatibility
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // Cache for 5 mins
        
        return res.end(JSON.stringify(responseData, null, 2));

    } catch (err) {
        console.error('[API Registry Resolve] Error:', err.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end(`VBook Server Error: ${err.message}`);
    }
};
