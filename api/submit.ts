import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "../server/cors.js";
import { getRateLimitKey, parseBody } from "../server/request.js";
import { getSupabaseAdmin } from "../server/supabase-admin.js";
import { submissionSchema } from "../shared/submission.js";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const originAllowed = applyCors(request, response);

  if (request.method === "OPTIONS") {
    return response.status(originAllowed ? 204 : 403).end();
  }

  if (!originAllowed) {
    return response.status(403).json({ error: "Origem nao autorizada." });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(405).json({ error: "Metodo nao permitido." });
  }

  try {
    const parsed = submissionSchema.safeParse(parseBody(request));
    if (!parsed.success) {
      return response.status(400).json({
        error: "Dados invalidos.",
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const supabase = getSupabaseAdmin();
    const { data: rateAllowed, error: rateError } = await supabase.rpc(
      "check_submission_rate_limit",
      {
        p_key: getRateLimitKey(request),
        p_limit: 10,
        p_window_seconds: 60,
      },
    );

    if (rateError) throw rateError;
    if (!rateAllowed) {
      response.setHeader("Retry-After", "60");
      return response.status(429).json({
        error: "Muitos envios. Aguarde um minuto e tente novamente.",
      });
    }

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        name: parsed.data.name,
        number_16: parsed.data.number16,
        number_4: parsed.data.number4,
        number_3: parsed.data.number3,
      })
      .select("id, created_at")
      .single();

    if (error) throw error;

    return response.status(201).json({ ok: true, submission: data });
  } catch (error) {
    console.error("submission_error", error);
    return response.status(500).json({
      error: "Nao foi possivel registrar os dados agora.",
    });
  }
}
