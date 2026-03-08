// js/config/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

/**
 * Supabase Client Configuration
 * Replace the placeholders with your actual project credentials 
 * from Supabase Dashboard > Project Settings > API
 */
const SUPABASE_URL = 'https://idarkfieeoxysqejrugs.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_z244cu5ANHBpdVOw2LIUBw_KgnpoGpS'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
