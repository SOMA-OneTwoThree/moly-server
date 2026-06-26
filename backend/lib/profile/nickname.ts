/**
 * 닉네임 정규화 + 유효성 검사 (단일 출처).
 *
 * 규칙: 문자열이어야 하고, 양끝 공백을 트림한 뒤 1~20자여야 한다.
 * 유효하면 트림된 닉네임을, 아니면 `null`을 반환한다. (DB의
 * `profiles_nickname_len` 체크 제약과 동일한 규칙)
 *
 * 문자 종류 제약은 없다(한글/영문/숫자/특수문자/이모지 모두 허용).
 */
export function normalizeNickname(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length < 1 || trimmed.length > 20) return null;
  return trimmed;
}
