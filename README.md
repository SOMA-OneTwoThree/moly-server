# moly-server — 모노레포 (backend + frontend)

Molly의 **제어 플레인(backend)**(인증·프로필·온보딩)과, **사업자 정책 안내 페이지(frontend)**를 한 레포에 둔다.

```
moly-server/
├── backend/    # Next.js 15 API 서버 (Supabase Auth + 구글 OAuth + 토큰 보호)
└── frontend/   # Next.js 15 최소 앱 (policy·/support 공개 페이지)
```

> **상세 아키텍처 문서 (단일 출처)**
> - 🔧 backend: [`backend/docs/ARCHITECTURE.md`](backend/docs/ARCHITECTURE.md) — 인증 모델·엔드포인트·데이터 접근 규칙·마이그레이션·런북
> - 🖥️ frontend: [`frontend/docs/ARCHITECTURE.md`](frontend/docs/ARCHITECTURE.md) — 라우트·인증 흐름·공개 페이지·스타일 토큰

## backend — 역할 요약
- **순수 API 서버, Bearer 전용.** 모든 클라이언트가 Supabase access token을 `Authorization: Bearer <token>`로 보낸다. 헬스체크만 공개, 나머지는 토큰 보호(`withAuth`/`requireUser`가 `supabase.auth.getUser(token)`로 권위 검증)
- **데이터 접근 규칙**: 사용자 대면 읽기(`GET /api/me`)만 RLS(토큰 클라이언트), 쓰기 및 존재확인은 service_role(admin) 경유 — profiles RLS에 쓰기 정책이 없기 때문. 쓰기는 반드시 검증된 `user.id`로만. (상세·이유는 backend 문서)

---

## frontend — 역할 요약
출시용 공개 페이지(`/policy`, `/support`). 상세는 [frontend 문서](frontend/docs/ARCHITECTURE.md).

Google → Authorized **redirect URIs** 에는 Supabase 콜백만: `https://<project-ref>.supabase.co/auth/v1/callback`.

---

## DB 마이그레이션
Supabase 대시보드 **SQL Editor**에서 `backend/supabase/migrations/`의 `0001`→`0002`→`0003`→`0004` 순서로 실행.
- `0002`는 `postgres` 권한으로 실행돼야 트리거가 동작 — 단, **`0004`가 이 자동생성 트리거를 되돌린다**(현재 온보딩은 API가 명시적으로 INSERT).
- `0003`은 mem0용 `pgvector` 확장. `0004`는 profiles를 nickname 중심 + SELECT 전용 RLS로 전환.
- 최종 스키마·주의사항은 [backend 문서](backend/docs/ARCHITECTURE.md#7-데이터-모델--마이그레이션) 참조.

## mem0 — 신원 계약
mem0 메모리의 `user_id` = 인증된 **`auth.users.id`** 와 동일해야 한다. 실제 mem0 호출은 moly-voice(Python)가 담당하고, 이 서버가 `getUser`로 확정한 `user.id`를 전달한다.
