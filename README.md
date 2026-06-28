# moly-server — 모노레포 (backend + frontend)

Molly의 **제어 플레인**(인증·프로필·온보딩)과, 인증 체인을 확인하는 **최소 프론트**(+ 출시용 공개 페이지)를 한 레포에 둔다. 실시간 오디오는 다루지 않는다(③ moly-voice 몫).

```
moly-server/
├── backend/    # Next.js 15 API 서버 (Supabase Auth + 구글 OAuth + 토큰 보호)
└── frontend/   # Next.js 15 최소 앱 (구글 로그인 → /api/me 체인 확인 + /policy·/support 공개 페이지)
```

Vercel에는 **프로젝트 2개**로 붙인다 — 각 Root Directory를 `backend` / `frontend`로 지정(같은 레포, npm workspaces 불필요).

> **상세 아키텍처 문서 (단일 출처)**
> - 🔧 backend: [`backend/docs/ARCHITECTURE.md`](backend/docs/ARCHITECTURE.md) — 인증 모델·엔드포인트·데이터 접근 규칙·마이그레이션·런북
> - 🖥️ frontend: [`frontend/docs/ARCHITECTURE.md`](frontend/docs/ARCHITECTURE.md) — 라우트·인증 흐름·공개 페이지·스타일 토큰
>
> 엔드포인트·env·스키마의 **상세 표는 위 문서가 단일 출처**다. 이 README는 진입점 요약만 둔다(중복 기재 금지 → 드리프트 방지).

## backend — 역할 요약
- **순수 API 서버, Bearer 전용.** 모든 클라이언트가 Supabase access token을 `Authorization: Bearer <token>`로 보낸다. 헬스체크만 공개, 나머지는 토큰 보호(`withAuth`/`requireUser`가 `supabase.auth.getUser(token)`로 권위 검증). 로그인(토큰 발급)은 프론트가 Supabase SDK로 직접 처리.
- **canonical 유저 식별자**: `auth.users.id`(JWT `sub`, uuid).
- **데이터 접근 규칙**: 사용자 대면 읽기(`GET /api/me`)만 RLS(토큰 클라이언트), 쓰기 및 존재확인은 service_role(admin) 경유 — profiles RLS에 쓰기 정책이 없기 때문. 쓰기는 반드시 검증된 `user.id`로만. (상세·이유는 backend 문서)
- 엔드포인트는 현재 **5개**(health, me GET/DELETE, me/nickname PATCH, onboarding/complete POST) — 목록·응답은 [backend 문서](backend/docs/ARCHITECTURE.md#6-엔드포인트) 참조.
- `conversations`/`messages` 테이블은 **스키마만 준비**돼 있고 현재 API는 미구현(회원탈퇴 CASCADE 대상으로만 의미).

### backend env
키: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(admin·서버 전용), `CORS_ALLOWED_ORIGINS`(정확한 origin만, trailing slash·경로 금지). 설명은 [backend 문서](backend/docs/ARCHITECTURE.md#9-환경-변수) 참조. (로컬은 `backend/.env`)

> service_role 키는 **절대 클라이언트에 노출하지 않는다**(서버 전용).

## frontend — 역할 요약
구글 로그인 버튼 하나로 **발급(프론트 SDK)→Bearer→백엔드 `getUser`** 전체 체인을 확인하는 최소 앱 + 출시용 공개 페이지(`/policy`, `/support`). 상세는 [frontend 문서](frontend/docs/ARCHITECTURE.md).

### frontend env
키: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_BASE`(백엔드 base URL). 모두 `NEXT_PUBLIC_*` → **빌드 타임 인라인, 변경 시 재배포 필요**. (로컬은 `frontend/.env`)

> `NEXT_PUBLIC_*`는 빌드 시점에 번들에 박힌다. secret/service_role 키는 **절대 프론트에 두지 않는다**.

## 로컬 개발
```bash
# 터미널 1
cd backend && npm install && npm run dev      # http://localhost:3000
# 터미널 2
cd frontend && npm install && npm run dev     # http://localhost:3001
```
사전 설정(로컬 로그인용):
- 백엔드 `.env` `CORS_ALLOWED_ORIGINS=http://localhost:3001`
- Supabase → Authentication → URL Configuration → Redirect URLs: `http://localhost:3001/**`
- Google Cloud Console → OAuth client → Authorized JavaScript origins: `http://localhost:3001`

확인: `http://localhost:3001` → "Google로 로그인" → `/auth/callback` 경유 → 홈 복귀 → "/api/me 호출" → 200 + 본인 신원.

## 프론트 도메인을 등록하는 3곳 (형식 주의)
| 곳 | 값 | 형식 |
|---|---|---|
| Google → Authorized JavaScript origins | `https://<frontend>.vercel.app` | 경로 없음 |
| Supabase → Redirect URLs | `https://<frontend>.vercel.app/**` | `/**` 와일드카드 |
| 백엔드 `CORS_ALLOWED_ORIGINS` | `https://<frontend>.vercel.app` | trailing slash·경로 금지 |

Google → Authorized **redirect URIs** 에는 Supabase 콜백만: `https://<project-ref>.supabase.co/auth/v1/callback`.

## DB 마이그레이션
Supabase 대시보드 **SQL Editor**에서 `backend/supabase/migrations/`의 `0001`→`0002`→`0003`→`0004` 순서로 실행.
- `0002`는 `postgres` 권한으로 실행돼야 트리거가 동작 — 단, **`0004`가 이 자동생성 트리거를 되돌린다**(현재 온보딩은 API가 명시적으로 INSERT).
- `0003`은 mem0용 `pgvector` 확장. `0004`는 profiles를 nickname 중심 + SELECT 전용 RLS로 전환.
- 최종 스키마·주의사항은 [backend 문서](backend/docs/ARCHITECTURE.md#7-데이터-모델--마이그레이션) 참조.

## mem0 — 신원 계약
mem0 메모리의 `user_id` = 인증된 **`auth.users.id`** 와 동일해야 한다. 실제 mem0 호출은 moly-voice(Python)가 담당하고, 이 서버가 `getUser`로 확정한 `user.id`를 전달한다.
