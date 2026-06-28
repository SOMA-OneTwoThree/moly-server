# Frontend 아키텍처

인증 체인 확인용 **최소 앱** + 앱 출시에 필요한 **공개 페이지**(개인정보 처리방침·고객 지원)를 한 Next.js 앱에 둔다. 백엔드(`moly-server/backend`)와 짝을 이룬다.

> 이 문서가 frontend 구조의 **단일 출처**다. 라우트·env·스타일 토큰의 상세는 항상 여기에 기록하고, 루트 `README.md`는 요약 + 링크만 둔다.
>
> **문서 갱신 규칙**: 라우트 추가 → [라우트](#3-라우트) 표 갱신 / env 추가 → [환경 변수](#6-환경-변수) 표 갱신 / 새 공개 페이지 → [스타일링 컨벤션](#5-스타일링-컨벤션)을 따르고 자체 `metadata` 설정.

---

## 1. 개요 / 역할

- **인증 체인 검증 하니스**: 구글 로그인 버튼 하나로 **발급(프론트 SDK) → Bearer → 백엔드 `getUser`** 전체 체인을 눈으로 확인한다. 로그인 후 `/api/me`를 호출해 본인 신원(JSON)을 화면에 출력.
- **출시용 공개 페이지**: `/policy`(개인정보 처리방침·이용약관), `/support`(고객 지원). 로그인 없이 접근 가능 — 앱스토어/OAuth 심사 제출용.
- 미들웨어가 없어 **새 라우트는 기본 public**이다(아래 [라우트](#3-라우트) 참조).

## 2. 기술 스택

| 항목 | 값 |
|---|---|
| 프레임워크 | Next.js 15 (App Router), React 19 |
| 데이터/인증 | `@supabase/supabase-js` |
| 마크다운 | `react-markdown` + `remark-gfm` — `/policy` 렌더 전용 |
| 언어 | TypeScript(`strict`), `target ES2017`, `jsx: preserve` |
| 경로 별칭 | `@/*` → `./*` |
| 포트 | **3001** (`dev`/`start`). 백엔드는 3000 |
| 스크립트 | `dev` / `build` / `start` / `lint` / `typecheck` |

## 3. 라우트

App Router(`app/`). `pages/` 없음. **미들웨어/라우트 가드 없음** → 모든 라우트는 기술적으로 public이며, 홈의 "잠김"은 컴포넌트 내부 조건부 렌더링일 뿐이다.

| 경로 | 파일 | 타입 | 접근 | 용도 |
|---|---|---|---|---|
| `/` | `app/page.tsx` | 클라이언트 | 인증 게이트(UX) | 인증 체인 테스터. 로그인/세션 표시/`/api/me` 호출 |
| `/auth/callback` | `app/auth/callback/page.tsx` | 클라이언트 | 공개(전이) | OAuth 랜딩. `?code=` 자동 교환 후 `/`로 replace, 7s 타임아웃 |
| `/policy` | `app/policy/page.tsx` | 서버(`force-static`) | **공개** | `docs/policy.md`를 분리 렌더(개인정보 처리방침 + 이용약관) |
| `/support` | `app/support/page.tsx` | 서버(`force-static`) | **공개** | 고객 지원(문의 이메일·응답 시간·FAQ) |

## 4. 인증 / 데이터 흐름

`lib/supabaseClient.ts`:
- **모듈 레벨 싱글톤** `supabase` — strict-mode 재마운트에도 클라이언트 하나만 유지.
- 옵션: **`flowType: "pkce"`**(기본 implicit 대신 명시), `detectSessionInUrl: true`(콜백에서 SDK가 `?code=` 자동 교환 — 수동 `exchangeCodeForSession` 불필요), `persistSession: true`, `autoRefreshToken: true`.
- **`API_BASE`** = `NEXT_PUBLIC_API_BASE`(백엔드 base URL, 빌드 타임 인라인).

체인(홈 → 백엔드), `app/page.tsx`:
1. 마운트 시 `supabase.auth.getSession()`으로 세션 시드 + `onAuthStateChange` 구독(언마운트 시 해제).
2. `signIn()` → `signInWithOAuth({ provider: "google", options: { redirectTo: ${origin}/auth/callback } })`.
3. `callMe()` → `getSession()`의 `access_token`을 꺼내 `fetch(${API_BASE}/api/me, { headers: { Authorization: Bearer <token> } })` → JSON/에러 출력(CORS·네트워크 catch).
4. `signOut()` → `supabase.auth.signOut()`.

콜백(`app/auth/callback/page.tsx`): `handled` ref로 strict-mode 이중 실행 가드, `getSession()` + `onAuthStateChange`로 세션 확정 후 `/`로 이동, **7s 타임아웃**으로 무한 대기 방지(PKCE verifier 분실/다른 브라우저 동의 등 커버).

## 5. 공개 페이지 (`/policy`, `/support`)

- 둘 다 **서버 컴포넌트 + `export const dynamic = "force-static"`** → 빌드 타임에 정적 HTML 생성(런타임 파일 I/O 없음).
- `/policy`: `docs/policy.md`를 읽어 `# 이용약관` 헤딩 기준으로 **개인정보 처리방침 / 이용약관 두 섹션**(`#privacy` / `#terms`)으로 분리, `react-markdown + remark-gfm`로 렌더(GFM 테이블 지원).
- `/support`: 문의 이메일·응답 시간·FAQ. 콘텐츠는 컴포넌트 내 상수.

## 6. 스타일링 컨벤션

전역 CSS 없음. 다크 테마 기준 토큰은 다음과 같다(배경·본문 텍스트는 루트 `app/layout.tsx`의 `<body>` 인라인 스타일이 기준, 나머지는 공개 페이지 CSS Module에서 사용 중인 값).

| 토큰 | 값 | 용도 |
|---|---|---|
| 배경 | `#0b0c10` | 페이지 배경 |
| 본문 텍스트 | `#e8e8e8` | 기본 글자 |
| 카드 표면 | `#16181d` / `#14161b` | 카드/박스 |
| 보더 | `#2a2c33` | 구분선/테두리 |
| 링크/포인트 | `#6ea8fe` | 공개 페이지 링크 |
| 보조 텍스트 | `#b6bdc7` / `#8b929e` | 설명/라벨 |

**가이드(앞으로):**
- 신규 페이지는 **CSS Module**(`*.module.css`)을 사용한다(공개 페이지 `policy`/`support`가 이 방식).
- 신규 **공개 페이지는 자체 `metadata`(title 등)를 반드시 설정**한다(루트 layout의 dev용 title이 fallback으로 노출되지 않도록).

## 7. 환경 변수

모두 `NEXT_PUBLIC_*`(브라우저 노출, **빌드 타임 번들 인라인** — 변경 시 재배포 필요).

| 키 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable/anon 키(브라우저 노출 안전, RLS 보호) |
| `NEXT_PUBLIC_API_BASE` | 백엔드 base URL |

> secret/service_role 키는 **절대 프론트에 두지 않는다**.

## 8. 개선 백로그

### 처리 완료
- ✅ **디자인 토큰 단일화**: `app/globals.css`의 `:root` CSS 변수로 다크 테마 토큰을 모았다(`layout.tsx`에서 import). primary blue 충돌은 앱 포인트색 `--accent`(#6ea8fe)와 구글 브랜드색 `--google`(#4285f4, 로그인 버튼 전용)으로 분리, 보더 그레이는 `--border`(#2a2c33)로 통일. 인라인/CSS Module 모두 `var(--*)` 참조.
- ✅ **`apiFetch` 헬퍼 추출**: `lib/api.ts`에 세션 토큰 추출 + `API_BASE` + Bearer 호출을 모았다(상대경로 가드 포함). `page.tsx`의 `callMe`가 사용.

### 향후 리팩토링 후보 (미적용)
- **스타일링 2종 혼재**: 인라인 스타일(`layout.tsx`, `page.tsx`, `auth/callback`)과 CSS Module(`policy`/`support`)이 공존. 토큰은 단일화됐으나 스타일 작성 방식은 아직 두 가지(전역 CSS는 `:root` 변수 정의 용도뿐). 한쪽으로 수렴 여지.
- **공용 컴포넌트 부재**: `components/` 없음. 카드/버튼/`pre` 등 반복 UI를 컴포넌트화 여지.
