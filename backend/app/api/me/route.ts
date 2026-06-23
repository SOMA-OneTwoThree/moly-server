import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";

/**
 * Protected: returns the authenticated user + their profile row. Proves the full
 * chain end-to-end (token/cookie -> getUser -> RLS-scoped query -> trigger-created
 * profile). The supabase client here is user-scoped, so the profiles query runs
 * under RLS and can only return this user's own row.
 *
 * Uses only the anon-key user-scoped client (no admin import), so it stays on the
 * default (Edge-eligible) runtime.
 */
export const GET = withAuth(async (_req, { user, supabase }) => {
  // Profile is OPTIONAL: the app schema (profiles table) may not exist yet while
  // the ERD is being finalized. Auth must succeed regardless, so a missing table
  // or missing row degrades to `profile: null` instead of failing the request.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, locale, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile: profile ?? null,
    ...(error ? { profileNote: error.message } : {}),
  });
});
