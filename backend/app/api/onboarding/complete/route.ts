import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeNickname } from "@/lib/profile/nickname";
import { PROFILE_COLUMNS } from "@/types/profile";

// admin 클라이언트(service_role)를 쓰므로 Node.js 런타임 고정.
export const runtime = "nodejs";

/**
 * POST /api/onboarding/complete
 * 첫 회원의 온보딩 완료. 닉네임을 받아 profiles row를 생성한다.
 * RLS에 INSERT 정책이 없으므로 admin(service_role) 경유로만 쓸 수 있고,
 * 검증된 `user.id`로만 INSERT 한다(외부 입력 id 미사용).
 *
 * Body: { nickname: string }
 *
 * 응답:
 *   201 { profile }                              — 성공
 *   400 { error }                                — JSON/닉네임 유효성 실패
 *   409 { error: 'Already onboarded', profile }  — 이미 profile 존재(멱등 재시도용)
 *   401, 500
 */
export const POST = withAuth(async (req, { user }) => {
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

  // 멱등성: 이미 온보딩 완료 상태면 409로 알림(클라이언트 재시도 처리 가능).
  const { data: existing } = await admin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Already onboarded", profile: existing },
      { status: 409 },
    );
  }

  const { data, error } = await admin
    .from("profiles")
    .insert({ id: user.id, nickname })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data }, { status: 201 });
});
