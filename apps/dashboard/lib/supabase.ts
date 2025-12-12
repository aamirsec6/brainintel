/**
 * Supabase Client
 * Initialize Supabase client for authentication and database access
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opemkjouudqqqvpchltl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export { supabase };
export const isSupabaseEnabled = !!supabase;

