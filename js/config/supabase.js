// js/config/
// js/config/supabase.js
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Client Configuration
 * Vite automatically injects environment variables from .env if they have the VITE_ prefix.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase credentials missing! Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

