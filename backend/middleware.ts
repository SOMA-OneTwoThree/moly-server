import { NextResponse, type NextRequest } from "next/server";
import { applyCors } from "@/lib/cors";
import { isPublicPath } from "@/lib/auth/public-paths";

/**
 * Runs on every /api request:
 *  1. CORS preflight (OPTIONS) + CORS headers on every response (single source).
 *  2. A coarse, fail-closed gate: private paths must carry a Bearer header.
 *
 * The gate is an early, network-free rejection — NOT the security boundary. A
 * request with a bogus Bearer passes here and is rejected by
 * `withAuth`/`requireUser` in the handler (the real authority, which validates
 * the token against the Supabase Auth server via `getUser`).
 *
 * Public paths (health) never reach the gate. All clients (web/app/voice)
 * authenticate with `Authorization: Bearer <access_token>`.
 */
export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return applyCors(req, new NextResponse(null, { status: 204 }));
  }

  if (isPublicPath(req.nextUrl.pathname)) {
    return applyCors(req, NextResponse.next());
  }

  const hasBearer = req.headers.get("authorization")?.startsWith("Bearer ");
  if (!hasBearer) {
    return applyCors(
      req,
      NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    );
  }

  return applyCors(req, NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"],
};
