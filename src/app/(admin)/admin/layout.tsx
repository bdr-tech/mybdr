import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

// 관리자 역할 타입 (sidebar.tsx와 동일)
type AdminRole = "super_admin" | "site_admin" | "tournament_admin" | "partner_member" | "org_member";

/**
 * Admin 레이아웃: 권한별 접근 제어
 * - super_admin: 전체 메뉴
 * - site_admin (admin_role): 유저/코트/커뮤니티/경기/팀/분석
 * - tournament_admin (membershipType=3): 대시보드 + 대회관리 링크
 * - partner_member: DB partner_members 소속 확인
 * - org_member: DB organization_members 소속 확인
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWebSession();
  if (!session) {
    redirect("/login");
  }

  // 유저의 관리 역할 목록을 수집
  const roles: AdminRole[] = [];
  const userId = BigInt(session.sub);

  // 1) super_admin 체크 (role 필드 또는 admin_role 필드)
  if (session.role === "super_admin") {
    roles.push("super_admin");
  }

  // 2) site_admin 체크 (admin_role 필드에 지정된 경우)
  if (session.admin_role === "site_admin") {
    roles.push("site_admin");
  }

  // 3) tournament_admin 체크 (membershipType=3 → role="tournament_admin")
  if (session.role === "tournament_admin") {
    roles.push("tournament_admin");
  }

  // 4) partner_member 체크: DB에서 파트너사 소속 여부 확인
  // 5) org_member 체크: DB에서 단체 소속 여부 확인
  // super_admin이 아닐 때만 DB 조회 (super_admin은 이미 전체 권한)
  if (!roles.includes("super_admin")) {
    const [partnerMembership, orgMembership] = await Promise.all([
      prisma.partner_members.findFirst({
        where: { user_id: userId, is_active: true },
        select: { id: true },
      }),
      prisma.organization_members.findFirst({
        where: { user_id: userId, is_active: true },
        select: { id: true },
      }),
    ]);

    if (partnerMembership) roles.push("partner_member");
    if (orgMembership) roles.push("org_member");
  }

  // 아무 관리 역할도 없으면 접근 불가 → 에러 메시지와 함께 로그인 페이지로
  if (roles.length === 0) {
    redirect("/login?error=no_permission");
  }

  // 배경: 프론트 디자인 시스템과 동일한 CSS 변수 사용
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* 역할 배열을 사이드바에 전달하여 권한별 메뉴 필터링 */}
      <AdminSidebar roles={roles} />
      {/* ml-64: 사이드바 w-64에 맞춤 */}
      <main className="lg:ml-64">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
