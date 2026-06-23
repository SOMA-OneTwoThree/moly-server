"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/**
 * OAuth 콜백 착지점. signInWithOAuth 의 redirectTo 가 여기로 돌아온다.
 * detectSessionInUrl: true 라서 SDK 가 ?code= 를 자동 교환한다 — 여기서는
 * 수동 exchangeCodeForSession 을 호출하지 않는다(이중 교환 시 코드 단일사용 에러).
 * 세션이 생기면 홈으로 보내고, 일정 시간 안에 안 생기면 에러를 보여 준다
 * (다른 브라우저에서 동의했거나 PKCE verifier 가 유실된 경우 무한 빈 화면 방지).
 */
export default function AuthCallback() {
  const router = useRouter();
  const handled = useRef(false); // strict-mode 이중 실행 가드
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      router.replace("/");
    };

    // 이미 세션이 있거나, 자동 교환으로 곧 생길 세션을 감지.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) finish();
    });

    // 안전망: 7초 내 세션 없으면 실패로 간주.
    const timer = setTimeout(() => {
      if (!done) {
        setError(
          "로그인을 완료하지 못했습니다. 같은 브라우저에서 다시 시도하세요.",
        );
      }
    }, 7000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "80px 20px" }}>
      {error ? (
        <>
          <p style={{ color: "#ff8a8a" }}>{error}</p>
          <Link href="/" style={{ color: "#4285f4" }}>
            홈으로 돌아가기
          </Link>
        </>
      ) : (
        <p>로그인 처리 중…</p>
      )}
    </main>
  );
}
