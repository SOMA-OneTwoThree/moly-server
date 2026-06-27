import type { Metadata } from "next";
import styles from "./support.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "고객 지원 | 몰리(moly)",
  description: "몰리(moly) 서비스 이용 문의 및 자주 묻는 질문 안내 페이지입니다.",
};

const SUPPORT_EMAIL = "nonoeul123@gmail.com";

const FAQ: { q: string; a: string }[] = [
  {
    q: "음성 인식이 안 돼요",
    a: "설정에서 마이크 권한을 확인해주세요.",
  },
  {
    q: "회원 탈퇴는 어떻게 하나요?",
    a: "앱 내 설정 > 회원 탈퇴에서 진행하실 수 있습니다.",
  },
];

export default function SupportPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>몰리 고객 지원</h1>
        <p className={styles.lead}>
          서비스 이용 중 문의사항이나 불편한 점이 있으시면
          <br />
          아래 이메일로 연락 주시면 신속하게 답변 드리겠습니다.
        </p>
      </header>

      <section className={styles.card} aria-label="문의 연락처">
        <div className={styles.row}>
          <span className={styles.label}>이메일</span>
          <a className={styles.email} href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </div>
        <div className={styles.divider} />
        <div className={styles.row}>
          <span className={styles.label}>응답 시간</span>
          <span className={styles.value}>영업일 기준 1~3일 이내</span>
        </div>
      </section>

      <section aria-label="자주 묻는 질문">
        <h2 className={styles.faqTitle}>자주 묻는 질문</h2>
        <ul className={styles.faqList}>
          {FAQ.map((item) => (
            <li key={item.q} className={styles.faqItem}>
              <p className={styles.faqQ}>Q. {item.q}</p>
              <p className={styles.faqA}>{item.a}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
