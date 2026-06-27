import { readFile } from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./policy.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "개인정보 처리방침 및 이용약관 | 몰리(moly)",
  description: "몰리(moly) 서비스의 개인정보 처리방침과 이용약관입니다.",
};

const TERMS_HEADING = "# 이용약관";

async function loadPolicy(): Promise<{ privacy: string; terms: string }> {
  const raw = await readFile(
    path.join(process.cwd(), "docs/policy.md"),
    "utf-8"
  );
  const [privacy, ...rest] = raw.split(`\n${TERMS_HEADING}`);
  const terms = rest.length ? `${TERMS_HEADING}${rest.join(`\n${TERMS_HEADING}`)}` : "";
  return { privacy: privacy.trim(), terms: terms.trim() };
}

export default async function PolicyPage() {
  const { privacy, terms } = await loadPolicy();

  return (
    <main className={styles.doc}>
      <nav className={styles.nav} aria-label="문서 바로가기">
        <a href="#privacy">개인정보 처리방침</a>
        <a href="#terms">이용약관</a>
      </nav>

      <section id="privacy">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{privacy}</ReactMarkdown>
      </section>

      {terms && (
        <section id="terms">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{terms}</ReactMarkdown>
        </section>
      )}
    </main>
  );
}
