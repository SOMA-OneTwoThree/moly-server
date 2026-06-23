import type { NextRequest, NextResponse } from "next/server";

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Apply CORS headers to a response, in place. Applied centrally in the
 * middleware so headers are set exactly once (duplicate
 * Access-Control-Allow-Origin headers are rejected by browsers).
 *
 * Because credentialed requests are supported, the allowed origin must be
 * echoed explicitly (never `*`) and only when it is on the allowlist. Native
 * app clients do not send an Origin header and are unaffected.
 */
export function applyCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.append("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Authorization,Content-Type",
    );
    res.headers.set("Access-Control-Max-Age", "86400");
  }
  return res;
}
