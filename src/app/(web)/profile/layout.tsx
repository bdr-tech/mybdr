import type { Metadata } from "next";

// SEO: 내 프로필 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "내 프로필 | MyBDR",
  description: "내 프로필, 경기 기록, 능력치를 확인하고 관리하세요.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
