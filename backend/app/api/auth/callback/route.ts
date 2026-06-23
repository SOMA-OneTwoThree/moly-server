import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";

/**
 * Public: OAuth callback. Exchanges the PKCE `code` for a session and sets the
 * session cookies on the redirect response, then sends the browser to `next`.
 * Handles the `error` case (e.g. user denied consent) without throwing.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const appOrigin = process.env.APP_ORIGIN ?? origin;
  const next = safeNextPath(searchParams.get("next"));

  const errorParam = searchParams.get("error");
  if (errorParam) {
    const reason = searchParams.get("error_description") ?? errorParam;
    return NextResponse.redirect(
      `${appOrigin}/api/auth/error?reason=${encodeURIComponent(reason)}`,
    );
  }

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      `${appOrigin}/api/auth/error?reason=missing_code`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${appOrigin}/api/auth/error?reason=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${appOrigin}${next}`);
}
