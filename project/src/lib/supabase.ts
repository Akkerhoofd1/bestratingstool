import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export const createClient = () => supabase;

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  created_at: string;
  updated_at: string;
}
