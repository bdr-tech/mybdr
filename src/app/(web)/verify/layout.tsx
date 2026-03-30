import type { Metadata } from "next";

// SEO: 본인 인증 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "본인 인증 | MyBDR",
  description: "본인 인증을 완료하여 계정을 활성화하세요.",
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
