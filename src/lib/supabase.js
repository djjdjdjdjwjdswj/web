import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const SUPABASE_ENV_OK = Boolean(supabaseUrl && supabaseAnonKey);

// ВАЖНО: если env нет — НЕ создаём клиента, чтобы приложение не падало до FatalEnv
export const supabase = SUPABASE_ENV_OK
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
