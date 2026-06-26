import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeNickname } from "@/lib/profile/nickname";
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nickname = normalizeNickname((body as { nickname?: unknown })?.nickname);
  if (!nickname) {
    return NextResponse.json(
      { error: "Invalid nickname (must be 1-20 chars after trimming)" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ nickname })
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // 변경된 row가 없으면(=온보딩 전) profile 부재.
  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: data });
});
