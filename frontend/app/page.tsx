"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/api";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [meResult, setMeResult] = useState<string>("");
  const [meError, setMeError] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMeResult("");
    setMeError("");
  }

  async function callMe() {
    setMeResult("");
    setMeError("");
    try {
      const res = await apiFetch("/api/me");
      if (res === null) {
        setMeError("세션 없음 — 먼저 로그인하세요.");
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        setMeError(`HTTP ${res.status}: ${JSON.stringify(body)}`);
        return;
      }
      setMeResult(JSON.stringify(body, null, 2));
    } catch (e) {
      setMeError(`요청 실패(CORS/네트워크 확인): ${String(e)}`);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>moly — 인증 체인 확인</h1>
      <p style={{ color: "#9aa0a6", marginTop: 0, fontSize: 14 }}>
        구글 로그인 → access_token 발급(프론트) → Bearer 로 백엔드{" "}
        <code>/api/me</code> 호출 → 본인 신원 반환까지 확인.
      </p>

      {loading ? (
        <p>불러오는 중…</p>
      ) : session ? (
        <section style={{ display: "grid", gap: 12, marginTop: 24 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: "#9aa0a6" }}>로그인됨</div>
            <div style={{ fontSize: 16 }}>{session.user.email}</div>
            <div style={{ fontSize: 12, color: "#6b7177", wordBreak: "break-all" }}>
              user.id: {session.user.id}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={primaryBtn} onClick={callMe}>
              /api/me 호출
            </button>
            <button style={ghostBtn} onClick={signOut}>
              로그아웃
            </button>
          </div>
          {meResult && (
            <pre style={preStyle}>{meResult}</pre>
          )}
          {meError && (
            <pre style={{ ...preStyle, color: "var(--danger)" }}>{meError}</pre>
          )}
        </section>
      ) : (
        <section style={{ marginTop: 24 }}>
          <button style={googleBtn} onClick={signIn}>
            Google로 로그인
          </button>
        </section>
      )}
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 16,
  display: "grid",
  gap: 4,
};
// 앱 포인트색 버튼(/api/me 호출 등). 구글 로그인 버튼은 googleBtn(브랜드색)을 쓴다.
const primaryBtn: React.CSSProperties = {
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 14,
  cursor: "pointer",
};
// 구글 로그인 전용 — 구글 브랜드 색을 유지한다.
const googleBtn: React.CSSProperties = {
  ...primaryBtn,
  background: "var(--google)",
};
const ghostBtn: React.CSSProperties = {
  background: "transparent",
  color: "var(--text)",
  border: "1px solid #3a3f47",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 14,
  cursor: "pointer",
};
const preStyle: React.CSSProperties = {
  background: "var(--surface-inset)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 14,
  fontSize: 13,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
};
