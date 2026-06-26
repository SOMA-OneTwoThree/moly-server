export interface Profile {
  /** UUID, auth.users.id와 동일. */
  id: string;
  /** 닉네임. 트림 후 1~20자, 중복 허용. */
  nickname: string;
  /** ISO 8601 */
  created_at: string;
  /** ISO 8601 */
  updated_at: string;
}

/** 모든 profile 조회/반환에 쓰는 컬럼 셀렉트(단일 출처). */
export const PROFILE_COLUMNS = "id, nickname, created_at, updated_at" as const;
