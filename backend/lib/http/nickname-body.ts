import type { NextRequest, NextResponse } from "next/server";
import { normalizeNickname } from "@/lib/profile/nickname";
import { errorResponse } from "@/lib/http/responses";

/**
 * 요청 body에서 nickname을 파싱·검증한다(닉네임을 받는 라우트 공통).
 *
 * 성공 시 `{ nickname }`(트림·검증 완료), 실패 시 `{ error }`(그대로 반환할 400
 * 응답)를 돌려준다. 호출부는 `if ("error" in parsed) return parsed.error;`로
 * 분기한 뒤 `parsed.nickname`을 쓴다.
 *
 * `normalizeNickname`(단일 출처)을 그대로 사용하므로 검증 규칙은 한 곳에만 둔다.
 */
export async function parseNicknameBody(
  req: NextRequest,
): Promise<{ nickname: string } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: errorResponse("Invalid JSON body", 400) };
  }

  const nickname = normalizeNickname((body as { nickname?: unknown })?.nickname);
  if (!nickname) {
    return {
      error: errorResponse(
        "Invalid nickname (must be 1-20 chars after trimming)",
        400,
      ),
    };
  }

  return { nickname };
}
