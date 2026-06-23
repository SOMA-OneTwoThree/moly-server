-- mem0(메모리 레이어) 준비: pgvector 확장.
-- mem0의 Supabase 벡터 스토어는 이 확장을 필요로 한다. mem0는 첫 실행 시
-- 자체 테이블을 자동 생성하므로 여기서는 확장만 보장한다(idempotent).
-- 메모리의 user_id 는 인증된 Supabase auth.users.id(=auth.uid())와 동일해야 한다.
create extension if not exists vector;
