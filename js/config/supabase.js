// js/config/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

/**
 * Supabase Client Configuration
 * In production (Vercel), we expect these to be available on window.env
 * In local development, we fallback to the hardcoded keys.
 */

const SUPABASE_URL = window.env?.SUPABASE_URL || 'https://idarkfieeoxysqejrugs.supabase.co';
const SUPABASE_ANON_KEY = window.env?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkYXJrZmllZW94eXNxZWpydWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDI3MTEsImV4cCI6MjA4NzUxODcxMX0.K5x9mp5MiJvr0_wjSbHp-9n9FUHzIJAdIZgHopfjeCE';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase credentials missing! Ensure environment variables are set.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
