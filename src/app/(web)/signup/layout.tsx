import type { Metadata } from "next";

// SEO: 회원가입 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "회원가입 | MyBDR",
  description: "MyBDR에 가입하고 농구 매칭 서비스를 이용하세요.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
