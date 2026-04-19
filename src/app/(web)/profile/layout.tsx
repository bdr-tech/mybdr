import type { Metadata } from "next";
// 프로필 서브페이지 공용 네비를 렌더하기 위한 client shell
// (server layout에서 metadata는 유지하면서, sideNav만 client로 분리)
import { ProfileShell } from "@/components/profile/profile-shell";

// SEO: 내 프로필 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "내 프로필 | MyBDR",
  description: "내 프로필, 경기 기록, 능력치를 확인하고 관리하세요.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  // ProfileShell이 PC 좌측 aside + 모바일 상단 chip 네비를 책임진다.
  // children은 6개 서브페이지(edit/basketball/growth/preferences/subscription/weekly-report)
  // 그리고 /profile 루트(page.tsx)도 동일하게 감싼다.
  return <ProfileShell>{children}</ProfileShell>;
}
