import type { NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseTokenClient } from "@/lib/supabase/token";

export type AuthContext = {
  /** The authenticated user. `user.id` is the canonical identity (auth.uid()). */
  user: User;
  /** A user-scoped Supabase client (RLS runs as this user). */
  supabase: SupabaseClient;
};

/**
 * Resolve the authenticated user from EITHER an `Authorization: Bearer <token>`
 * header (native/app clients) OR the cookie session (web clients).
 *
 * `getUser()` / `getUser(token)` always hits the Supabase Auth server, so the
 * returned user is authoritative — the JWT is never trusted locally. Returns
 * `null` when neither path yields a valid user.
 */
export async function requireUser(
  req: NextRequest,
): Promise<AuthContext | null> {
  const authz = req.headers.get("authorization");

  if (authz?.startsWith("Bearer ")) {
    const token = authz.slice("Bearer ".length).trim();
    if (!token) return null;
    const supabase = createSupabaseTokenClient(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { user: data.user, supabase };
  }

  // Fall back to the cookie session (web).
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, supabase };
}
