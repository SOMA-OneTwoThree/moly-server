import type { ReactNode } from "react";

export const metadata = {
  title: "moly — 로그인 확인",
  description: "Supabase 구글 로그인 + 백엔드 인증 체인 확인용 최소 프론트",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          background: "#0b0c10",
          color: "#e8e8e8",
        }}
      >
        {children}
      </body>
    </html>
  );
}
