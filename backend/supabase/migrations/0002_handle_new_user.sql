-- 신규 auth.users 가입 시 profiles 행 자동 생성 (구글 OAuth 포함).
-- security definer: auth 내부 insert 트랜잭션에는 auth.uid() 세션이 없으므로,
-- RLS가 걸린 profiles에 쓰려면 테이블 owner(postgres) 권한으로 실행돼야 한다.
-- → Supabase SQL Editor(=postgres)에서 실행할 것.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    'ko'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 트리거 도입 이전에 가입한 유저 백필.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
