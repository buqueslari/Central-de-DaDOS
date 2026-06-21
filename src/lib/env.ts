export const previewMode =
  import.meta.env.DEV && import.meta.env.VITE_PREVIEW_MODE === "true";

export function requireSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para acessar o painel.",
    );
  }

  return { url, anonKey };
}
