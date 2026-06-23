import type { NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseTokenClient } from "@/lib/supabase/token";

export type AuthContext = {
  /** The authenticated user. `user.id` is the canonical identity (auth.uid()). */
  user: User;
  /** A user-scoped Supabase client (RLS runs as this user). */
  supabase: SupabaseClient;
};

/**
 * Resolve the authenticated user from an `Authorization: Bearer <token>` header.
 * All clients (web/app/voice) send the Supabase access token this way.
 *
 * `getUser(token)` always hits the Supabase Auth server, so the returned user is
 * authoritative — the JWT is never trusted locally. Returns `null` when there is
 * no Bearer header or the token is invalid.
 */
export async function requireUser(
  req: NextRequest,
): Promise<AuthContext | null> {
  const authz = req.headers.get("authorization");
  if (!authz?.startsWith("Bearer ")) return null;

  const token = authz.slice("Bearer ".length).trim();
  if (!token) return null;

  const supabase = createSupabaseTokenClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { user: data.user, supabase };
}
