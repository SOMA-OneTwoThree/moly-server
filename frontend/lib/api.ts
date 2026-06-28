import { supabase, API_BASE } from "@/lib/supabaseClient";

/**
 * 현재 세션의 access token을 `Authorization: Bearer`로 붙여 백엔드(`API_BASE`)를
 * 호출한다. 세션이 없으면 `null`을 반환하므로 호출부가 "로그인 필요"를 분기할 수
 * 있다. 네트워크/CORS 실패는 `fetch`가 throw하므로 호출부에서 try/catch 한다.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response | null> {
  // 상대경로만 허용 — `//evil.com`·`/@evil` 같은 호스트 혼동으로 토큰이 외부
  // 호스트로 새는 패턴을 차단한다.
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("apiFetch: path must be an absolute path on the API host");
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });
}
