'use strict';

const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Client Helper
 * Note: Uses Service Role Key for backend operations to bypass RLS.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
