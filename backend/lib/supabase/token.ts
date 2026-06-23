import { createClient } from "@supabase/supabase-js";

/**
 * Bearer-token Supabase client for native/app clients.
 *
 * The access token is injected as the Authorization header so that subsequent
 * PostgREST queries run *as that user* — RLS (`auth.uid()`) is therefore
 * enforced. Uses the public (anon/publishable) key, never the service role.
 *
 * Validate the token with `client.auth.getUser(accessToken)` before trusting it
 * (see `lib/auth/require-user.ts`).
 */
export function createSupabaseTokenClient(accessToken: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
