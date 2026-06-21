import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

let browserClient: SupabaseClient | null = null;

export function getSupabase() {
  if (browserClient) return browserClient;
  const { url, anonKey } = requireSupabaseEnv();
  browserClient = createClient(url, anonKey);
  return browserClient;
}
