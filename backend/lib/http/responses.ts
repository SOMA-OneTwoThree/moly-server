import { NextResponse } from "next/server";

/**
 * 클라이언트에게 노출해도 되는 의도된 에러 응답을 만든다(400/401/404/409 등).
 * 메시지는 호출부가 정한 사용자 대면 문구만 담는다.
 */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * 내부(DB/admin) 에러용 500 응답. 원인 메시지(제약명·스키마·PG 코드 등)를
 * 클라이언트에 노출하지 않도록 일반화한 문구만 반환한다. 원인은 호출부에서
 * `console.error`로 서버 로그에만 남긴다(관측성 보존, 누출 방지).
 */
export function internalError() {
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
