import type { Metadata } from "next";

// SEO: 프로필 수정 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "프로필 수정 | MyBDR",
  description: "프로필 정보를 수정하세요.",
};

export default function ProfileEditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
