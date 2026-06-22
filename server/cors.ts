import type { VercelRequest, VercelResponse } from "@vercel/node";

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function applyCors(request: VercelRequest, response: VercelResponse) {
  const rawOrigin = request.headers.origin;
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;
  const normalizedOrigin = origin?.replace(/\/$/, "");
  const isAllowed = Boolean(normalizedOrigin && allowedOrigins().includes(normalizedOrigin));

  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Max-Age", "86400");

  if (isAllowed && origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }

  return isAllowed;
}
