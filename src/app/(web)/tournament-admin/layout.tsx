import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { TournamentAdminNav } from "./_components/tournament-admin-nav";

/**
 * 대회 관리 레이아웃 — 서버 컴포넌트로 권한 검증 수행.
 * role이 tournament_admin 또는 super_admin인 경우만 접근 가능.
 * 미로그인 또는 권한 부족 시 홈으로 리다이렉트.
 */
export default async function TournamentAdminLayout({ children }: { children: React.ReactNode }) {
  // 서버사이드 권한 체크: 대회관리자 또는 슈퍼관리자만 허용
  const session = await getWebSession();
  if (!session || (session.role !== "tournament_admin" && session.role !== "super_admin")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[var(--color-card)]">
      {/* 클라이언트 네비게이션 (usePathname 사용) */}
      <TournamentAdminNav />
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
