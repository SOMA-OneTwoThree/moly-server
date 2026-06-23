import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { applyCors } from "@/lib/cors";
import { isPublicPath } from "@/lib/auth/public-paths";

/**
 * Runs on every /api request. Responsibilities:
 *  1. CORS preflight (OPTIONS) + CORS headers on every response (single source).
 *  2. For PRIVATE paths only: refresh the web cookie session (@supabase/ssr
 *     cookie copy request->response) and run a coarse public/private gate.
 *
 * Public paths (health, auth) never touch Supabase here — login/callback manage
 * their own cookies in the handler — so a missing/unhealthy Supabase never
 * breaks the health check or the auth flow.
 *
 * The gate rejects private paths carrying neither a cookie session nor a Bearer
 * header. It is an early, cheap rejection, NOT the security boundary: a request
 * with a bogus Bearer passes here and is rejected by `withAuth`/`requireUser` in
 * the handler (the real authority). On any Supabase error it fails closed.
 *
 * Session refresh uses `getClaims()` (local JWKS verification for asymmetric
 * signing keys; transparent network fallback for legacy HS256 projects).
 *
 * Keep the service-role admin client OUT of this import graph (Edge runtime).
 */
export async function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return applyCors(req, new NextResponse(null, { status: 204 }));
  }

  if (isPublicPath(req.nextUrl.pathname)) {
    return applyCors(req, NextResponse.next());
  }

  // The response we will return; rebuilt whenever cookies are written so the
  // refreshed session cookies actually reach the browser (cookie-on-response).
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let hasSession = false;
  try {
    const { data } = await supabase.auth.getClaims();
    hasSession = !!data;
  } catch {
    // Supabase unreachable / misconfigured -> treat as no session (fail closed).
    hasSession = false;
  }

  const hasBearer = req.headers.get("authorization")?.startsWith("Bearer ");
  if (!hasSession && !hasBearer) {
    return applyCors(
      req,
      NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    );
  }

  return applyCors(req, response);
}

export const config = {
  matcher: ["/api/:path*"],
};
