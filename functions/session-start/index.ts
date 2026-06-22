// session-start — 인증된 유저의 새 대화 세션을 시작한다.
// 반환: { session_token, conversation_id, history }  (③ moly-voice 가 사용)
// 스캐폴드: 골격만. 인증 검증 + conversation 생성 + 최근 히스토리 로드 채울 것.

import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (_req: Request): Promise<Response> => {
  // TODO:
  // 1. Authorization JWT 검증 → user_id
  // 2. conversations insert → conversation_id
  // 3. 최근 N 메시지 로드(history)
  // 4. ③ voice 게이트웨이용 session_token 발급(user_id, conversation_id 포함)
  return new Response(
    JSON.stringify({ session_token: null, conversation_id: null, history: [] }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
