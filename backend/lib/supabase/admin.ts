import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. **Bypasses RLS entirely.**
 *
 * Use ONLY for trusted admin work with explicit, manual user scoping. Never
 * instantiate it on a code path driven by raw client input without scoping by
 * a verified user id.
 *
 * IMPORTANT: keep this file out of the middleware import graph. Any Route
 * Handler that imports it must set `export const runtime = "nodejs"`.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
