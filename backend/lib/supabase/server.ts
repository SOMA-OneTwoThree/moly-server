import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie-bound Supabase client for the App Router (web/browser sessions).
 *
 * Uses the current `getAll`/`setAll` cookie adapter (the old get/set/remove
 * triple is deprecated). In Next 15+, `cookies()` is async — it must be awaited.
 *
 * When called from a Server Component the cookie write throws (Server Components
 * cannot set cookies); that is expected and harmless because the middleware
 * refreshes the session cookie instead. Route Handlers can set cookies, so the
 * write succeeds there.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — ignore; middleware persists it.
          }
        },
      },
    },
  );
}
