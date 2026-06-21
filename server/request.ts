import { createHmac } from "node:crypto";
import type { VercelRequest } from "@vercel/node";

export function parseBody(request: VercelRequest): unknown {
  if (typeof request.body === "string") {
    return JSON.parse(request.body) as unknown;
  }
  return request.body;
}

export function getRateLimitKey(request: VercelRequest) {
  const salt = process.env.SUBMISSION_RATE_LIMIT_SALT;
  if (!salt || salt.length < 24) {
    throw new Error("SUBMISSION_RATE_LIMIT_SALT deve ter ao menos 24 caracteres.");
  }

  const forwarded = request.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = rawIp?.split(",")[0]?.trim() || request.socket.remoteAddress || "unknown";

  return createHmac("sha256", salt).update(ip).digest("hex");
}
