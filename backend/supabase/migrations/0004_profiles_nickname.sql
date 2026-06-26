-- 온보딩 모델 전환: profiles를 nickname 중심으로 재정의.
--
--  - 자동생성 트리거 제거(0002 되돌리기) → 가입 즉시 profile이 생기지 않는다.
--    백엔드 API(POST /api/onboarding/complete)가 명시적으로 INSERT 한다.
--    그래야 "profile == null" 이 곧 "온보딩 미완료" 신호로 성립한다.
--  - RLS는 SELECT(본인)만 허용 → INSERT/UPDATE/DELETE 정책은 두지 않는다.
--    결과적으로 anon/authenticated 역할은 변경 불가, 백엔드 service_role만 가능.
--  - display_name → nickname 이름변경, locale 제거, updated_at 추가.
--
-- 개발 초기(데이터 없음)라 파괴적 변경을 그대로 적용한다.

-- ============================================================
-- 1. 자동생성 트리거/함수 제거 (0002_handle_new_user 되돌리기)
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ============================================================
-- 2. 컬럼 정리: display_name → nickname, locale 제거, updated_at 추가
-- ============================================================
alter table public.profiles drop column if exists locale;
alter table public.profiles rename column display_name to nickname;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- nickname 제약: NOT NULL + 트림 후 1~20자. 중복 허용(unique 없음).
alter table public.profiles alter column nickname set not null;
alter table public.profiles
  add constraint profiles_nickname_len
  check (char_length(trim(nickname)) between 1 and 20);

comment on table public.profiles is '사용자 프로필. auth.users와 1:1, 온보딩 완료 시 백엔드가 생성.';
comment on column public.profiles.id is 'auth.users.id와 동일. CASCADE 삭제.';
comment on column public.profiles.nickname is '닉네임. 트림 후 1~20자, 중복 허용, 변경 무제한.';

-- ============================================================
-- 3. updated_at 자동 갱신 트리거
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. RLS: 0001의 "own profile"(FOR ALL) 정책을 SELECT 전용으로 교체
--    (conversations/messages 정책은 그대로 둔다 — 본 작업 범위 밖)
-- ============================================================
drop policy if exists "own profile" on public.profiles;

-- SELECT: 본인 row만 조회 가능. (service_role은 RLS 우회 → 백엔드는 무관)
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- INSERT/UPDATE/DELETE 정책은 만들지 않는다.
-- → authenticated/anon 역할은 변경 불가, 백엔드 service_role 경유로만 변경.
