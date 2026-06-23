import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "moly-server",
  description: "Molly control plane — auth, session, persistence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
