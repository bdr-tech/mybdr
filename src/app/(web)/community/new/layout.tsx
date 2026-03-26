import type { Metadata } from "next";

// SEO: 글쓰기 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "글쓰기 | MyBDR",
  description: "커뮤니티에 새 글을 작성하세요.",
};

export default function CommunityNewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
