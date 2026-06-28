import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseNicknameBody } from "@/lib/http/nickname-body";
import { errorResponse, internalError } from "@/lib/http/responses";
import { PROFILE_COLUMNS } from "@/types/profile";

// admin 클라이언트(service_role)를 쓰므로 Node.js 런타임 고정.
export const runtime = "nodejs";

/**
 * PATCH /api/me/nickname
 * 닉네임 변경. 횟수 제한 없음. RLS에 UPDATE 정책이 없으므로 admin 경유로만
 * 가능하고, 검증된 `user.id` row만 변경한다(외부 입력 id 미사용).
 *
 * Body: { nickname: string }
 *
 * 응답:
 *   200 { profile }                       — 성공
 *   400 { error }                         — JSON/닉네임 유효성 실패
 *   404 { error: 'Profile not found' }    — 온보딩 안 된 사용자 호출(정상 흐름 X)
 *   401, 500
 */
export const PATCH = withAuth(async (req, { user }) => {
  const parsed = await parseNicknameBody(req);
  if ("error" in parsed) return parsed.error;
  const { nickname } = parsed;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ nickname })
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error(error);
    return internalError();
  }
  // 변경된 row가 없으면(=온보딩 전) profile 부재.
  if (!data) {
    return errorResponse("Profile not found", 404);
  }

  return NextResponse.json({ profile: data });
});
