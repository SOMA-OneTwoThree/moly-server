import { createClient } from "@supabase/supabase-js";

/**
 * 브라우저용 Supabase 싱글톤. 모듈 레벨로 한 번만 생성되므로 React strict-mode
 * 재마운트에도 클라이언트는 하나만 유지된다.
 *
 * flowType 기본값은 'implicit'(해시 토큰)라서, ?code= 쿼리 + 자동 교환을 쓰려면
 * 'pkce'를 명시해야 한다. detectSessionInUrl: true 면 콜백 페이지 진입 시
 * SDK가 ?code= 를 알아서 교환한다(수동 exchangeCodeForSession 불필요).
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

/** 백엔드 base URL (빌드 타임 인라인). */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
