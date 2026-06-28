import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { internalError } from "@/lib/http/responses";
import { PROFILE_COLUMNS } from "@/types/profile";

// admin 클라이언트(service_role)를 쓰므로 Node.js 런타임 고정.
export const runtime = "nodejs";

/**
 * GET /api/me
 * 현재 사용자의 profile을 조회. 온보딩 여부 판단에 사용한다.
 *
 * 조회는 user-scoped 클라이언트(RLS, `profiles_select_own`)로 수행한다 — admin이
 * 필요 없는 읽기는 최소 권한 원칙에 따라 RLS를 거친다. 자동생성 트리거가 없으므로
 * 온보딩 전 사용자는 row가 없어 `profile: null`이 된다.
 *
 * 응답:
 *   200 { profile: {...} }   — 기존 회원
 *   200 { profile: null }    — 첫 로그인/온보딩 미완료
 *   401 { error }            — 인증 실패
 *   500 { error }            — 서버 에러
 */
export const GET = withAuth(async (_req, { user, supabase }) => {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return internalError();
  }

  return NextResponse.json({ profile: data ?? null });
});

/**
 * DELETE /api/me
 * 회원탈퇴. auth.users를 삭제하면 profiles 및 user_id로 연결된 모든 도메인
 * 테이블(conversations/messages 등)이 CASCADE로 함께 삭제된다.
 *
 * 검증된 `user.id`만 삭제한다(외부 입력 id를 받지 않음).
 *
 * 응답:
 *   200 { success: true }
 *   401 { error }
 *   500 { error }
 */
export const DELETE = withAuth(async (_req, { user }) => {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error(error);
    return internalError();
  }
  return NextResponse.json({ success: true });
});
