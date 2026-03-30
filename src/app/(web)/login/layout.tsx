import type { Metadata } from "next";

// SEO: 로그인 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "로그인 | MyBDR",
  description: "MyBDR에 로그인하여 경기와 팀을 관리하세요.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
