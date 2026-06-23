import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";

/**
 * Public: initiate Google OAuth for a WEB (browser) client.
 *
 * `signInWithOAuth` (server-side) writes the PKCE code-verifier cookie via the
 * cookie adapter and returns the provider URL; we redirect the browser there.
 * The verifier cookie is set on this redirect response — login-init and the
 * callback must share the same browser cookie jar.
 *
 * Native/app clients do NOT use this route — they authenticate directly with
 * the Supabase SDK and call protected endpoints with a Bearer token.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const appOrigin = process.env.APP_ORIGIN ?? origin;
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appOrigin}/api/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.json(
      { error: error?.message ?? "oauth_init_failed" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.url);
}
