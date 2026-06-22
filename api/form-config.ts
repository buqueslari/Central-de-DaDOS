import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "../server/cors.js";
import { getSupabaseAdmin } from "../server/supabase-admin.js";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  applyCors(response);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET, OPTIONS");
    return response.status(405).json({ error: "Metodo nao permitido." });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("form_settings")
      .select(
        "form_title, success_message, name_label, number_16_label, number_4_label, number_3_label",
      )
      .eq("singleton", true)
      .single();

    if (error) throw error;

    response.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
    return response.status(200).json(data);
  } catch (error) {
    console.error("form_config_error", error);
    return response.status(500).json({ error: "Configuracao indisponivel." });
  }
}
