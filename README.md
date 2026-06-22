# moly-server — 백엔드 / 제어 플레인

Molly의 **제어 플레인**. 인증·세션·대화 영속을 담당한다. 실시간 오디오는 다루지 않는다(③ moly-voice 몫).

> 프로덕션 3레포 중 **① server**. 전체 구조는 `moly-pipeline-test/docs/production-architecture.md` 참고.

## 역할
- **인증** (Supabase Auth)
- **세션 lifecycle** — 시작 시 session_token + 히스토리 발급(③가 사용)
- **대화 영속** — conversations / messages (Postgres, RLS로 유저 격리)
- 짧은 **REST** 요청만 → **서버리스(Edge Functions)** 로 충분 (실시간 스트림은 컨테이너 ②③)

## 스택
- **Supabase**: Auth + Postgres(RLS) + **Edge Functions(Deno/TS, 서버리스)**

## 구조
```
supabase/
└── migrations/        # 0001_init.sql (profiles/conversations/messages + RLS)
functions/             # Edge Functions
├── session-start/     # 인증→session_token, 히스토리·user_id 반환
├── turn-save/         # 턴 영속(③ voice 가 호출)
└── _shared/           # supabase 클라, 인증 미들웨어
```

## 앱이 호출하는 엔드포인트
| 메서드 | 용도 | 반환 |
|---|---|---|
| Supabase Auth | 로그인 | JWT |
| `POST /session-start` | 세션 시작 | `{ session_token, conversation_id, history }` |
| `GET /conversations` (예정) | 지난 대화 표시 | 목록 |
| `POST /turn-save` (③가 호출) | 턴 영속 | ok |

## 로컬 개발
```bash
cp .env.example .env
supabase start                       # 로컬 Supabase(Postgres+Auth)
supabase db reset                    # migrations 적용
supabase functions serve session-start
```

## 배포
```bash
supabase db push                     # 스키마
supabase functions deploy            # Edge Functions
```

## env
| 키 | 설명 |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase 프로젝트 |
| `JWT_SECRET` | session_token 서명(③ 검증) |
