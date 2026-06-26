import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client (service_role key). RLS는 우회된다.
 *
 * 위험: 이 클라이언트로 수행하는 모든 작업은 RLS를 통과하지 않는다. 반드시
 * `withAuth`/`requireUser`로 사용자를 검증한 뒤에만 쓰고, 검증된 `user.id`로만
 * 작업할 것. 외부 입력으로 받은 임의의 id를 넘기면 다른 사용자 데이터를
 * 조작할 수 있는 IDOR 취약점이 된다.
 *
 * service_role 키는 절대 클라이언트로 노출되면 안 된다(서버 전용 env).
 */
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
