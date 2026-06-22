import type { VercelRequest, VercelResponse } from "@vercel/node";

export function applyCors(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  response.setHeader("Access-Control-Max-Age", "86400");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return false;
  }

  return true;
}