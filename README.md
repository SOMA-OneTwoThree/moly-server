# moly-server — 모노레포 (backend + frontend)

Molly의 **제어 플레인**(인증·세션·대화 영속)과, 인증 체인을 확인하는 **최소 프론트**를 한 레포에 둔다. 실시간 오디오는 다루지 않는다(③ moly-voice 몫).

```
moly-server/
├── backend/    # Next.js 15 API 서버 (Supabase Auth + 구글 OAuth + 토큰 보호)
└── frontend/   # Next.js 15 최소 앱 (구글 로그인 버튼 → /api/me 호출로 체인 확인)
```

Vercel에는 **프로젝트 2개**로 붙인다 — 각 Root Directory를 `backend` / `frontend`로 지정(같은 레포, npm workspaces 불필요).

## backend — 역할
- **인증**: 순수 API 서버. **Bearer 전용** — 모든 클라이언트(웹·앱·voice)가 Supabase access token을 `Authorization: Bearer <token>`로 보낸다. 헬스체크만 공개, 나머지는 토큰 보호(`withAuth`/`requireUser`가 `supabase.auth.getUser(token)`로 권위 검증). 로그인(토큰 발급)은 프론트가 Supabase SDK로 직접 처리.
- **canonical 유저 식별자**: `auth.users.id`(JWT `sub`, uuid). 모든 보호 경로가 이 값만 신원으로 사용.
- 웹/앱이 붙는 **서버리스 REST 엔드포인트 서버**. 미들웨어는 CORS + Bearer 조기 차단만(보안 경계는 핸들러).

### 엔드포인트
| 메서드 | 경로 | 공개 | 용도 |
|---|---|---|---|
| GET | `/api/health` | ✅ | 헬스체크 |
| GET | `/api/me` | 🔒 | 인증 유저 + profile (Bearer) |

### backend env (Vercel 프로젝트 환경변수 / 로컬은 `backend/.env`)
| 키 | 설명 |
|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_ANON_KEY` | 공개(publishable/anon) 키 |
| `CORS_ALLOWED_ORIGINS` | 허용 origin(쉼표 구분). **정확한 origin만**(trailing slash·경로 금지) |

> service_role(secret) 키와 `APP_ORIGIN`은 현재 코드에서 쓰지 않는다(쿠키 웹로그인·admin 클라이언트 제거됨). RLS를 우회하는 service-role 엔드포인트가 생기면 그때 `SUPABASE_SERVICE_ROLE_KEY`를 다시 추가한다.

## frontend — 역할
구글 로그인 버튼 하나로 **발급(프론트 SDK)→Bearer→백엔드 `getUser`** 전체 체인을 눈으로 확인하는 최소 앱. 로그인 후 `/api/me`를 호출해 본인 신원(JSON)을 화면에 출력.

### frontend env (Vercel 프로젝트 환경변수 / 로컬은 `frontend/.env`)
| 키 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL (브라우저 노출 OK) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable 키 (브라우저 노출 안전, RLS 보호) |
| `NEXT_PUBLIC_API_BASE` | 백엔드 base URL. **빌드 타임 인라인 → 변경 시 재배포 필요** |

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
Supabase 대시보드 **SQL Editor**에서 `backend/supabase/migrations/`의 `0001`→`0002`→`0003` 순서로 실행. (`0002`는 `postgres` 권한으로 실행돼야 RLS 우회 insert 성공.) `0003`은 mem0용 `pgvector` 확장.

## mem0 — 신원 계약
mem0 메모리의 `user_id` = 인증된 **`auth.users.id`** 와 동일해야 한다. 실제 mem0 호출은 moly-voice(Python)가 담당하고, 이 서버가 `getUser`로 확정한 `user.id`를 전달한다.
