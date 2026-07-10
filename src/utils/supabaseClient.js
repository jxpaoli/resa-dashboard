import { createClient } from '@supabase/supabase-js';

// Tant que les 3 variables ne sont pas présentes → mode mock (localStorage).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const APP_ID = import.meta.env.VITE_APP_ID;

export const supabase = url && key && APP_ID ? createClient(url, key) : null;
export const isMock = !supabase;
