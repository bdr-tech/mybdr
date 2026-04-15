import Link from "next/link";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

/**
 * /referee/admin — 관리자 대시보드 (서버 컴포넌트).
 *
 * 이유: 정적 통계 표시만 하므로 서버에서 직접 Prisma 쿼리.
 *      API 호출 없이 서버에서 데이터를 가져오면 클라이언트 왕복이 줄어든다.
 *      (admin layout에서 이미 권한 체크 완료)
 */

export default async function AdminDashboardPage() {
  const session = await getWebSession();
  // layout에서 이미 검증됨. 방어용 null 체크.
  if (!session) return null;

  const userId = BigInt(session.sub);

  // 관리자의 소속 협회 조회
  const adminMapping = await prisma.associationAdmin.findUnique({
    where: { user_id: userId },
    include: {
      association: { select: { name: true, code: true } },
    },
  });
  if (!adminMapping) return null;

  const associationId = adminMapping.association_id;
  const associationName = adminMapping.association.name;

  // 4개 통계 병렬 조회
  const [totalReferees, certStats, unpaidTotal, recentAssignments] =
    await Promise.all([
      prisma.referee.count({
        where: { association_id: associationId },
      }),
      prisma.refereeCertificate.groupBy({
        by: ["verified"],
        where: { referee: { association_id: associationId } },
        _count: true,
      }),
      prisma.refereeSettlement.aggregate({
        where: {
          referee: { association_id: associationId },
          status: "pending",
        },
        _sum: { amount: true },
      }),
      prisma.refereeAssignment.count({
        where: {
          referee: { association_id: associationId },
          assigned_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  const verifiedCount =
    certStats.find((s) => s.verified === true)?._count ?? 0;
  const unverifiedCount =
    certStats.find((s) => s.verified === false)?._count ?? 0;
  const totalCerts = verifiedCount + unverifiedCount;
  const verificationRate =
    totalCerts > 0 ? Math.round((verifiedCount / totalCerts) * 100) : 0;
  const unpaidAmount = unpaidTotal._sum.amount ?? 0;

  // 통계 카드 데이터
  const stats = [
    {
      icon: "groups",
      label: "소속 심판",
      value: `${totalReferees}명`,
    },
    {
      icon: "verified",
      label: "자격증 검증율",
      value: `${verificationRate}%`,
      sub: `${verifiedCount}/${totalCerts}건`,
    },
    {
      icon: "payments",
      label: "미정산 총액",
      value: `${unpaidAmount.toLocaleString("ko-KR")}원`,
    },
    {
      icon: "event",
      label: "최근 30일 배정",
      value: `${recentAssignments}건`,
    },
  ];

  // 빠른 링크
  const quickLinks = [
    {
      href: "/referee/admin/members",
      icon: "manage_accounts",
      label: "심판 관리",
      description: "소속 심판 목록 조회 및 자격증 검증",
    },
    {
      href: "/referee/admin/bulk-verify",
      icon: "upload_file",
      label: "Excel 일괄 검증",
      description: "Excel 파일로 자격증 일괄 검증 처리",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header>
        <h1
          className="text-2xl font-black uppercase tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          관리자 대시보드
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {associationName} 관리 현황
        </p>
      </header>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: "var(--color-primary)" }}
              >
                {stat.icon}
              </span>
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                {stat.label}
              </span>
            </div>
            <p
              className="mt-2 text-xl font-black"
              style={{ color: "var(--color-text-primary)" }}
            >
              {stat.value}
            </p>
            {stat.sub && (
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {stat.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 빠른 링크 */}
      <section>
        <h2
          className="mb-3 text-sm font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          빠른 메뉴
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 p-4 transition-colors"
              style={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: "var(--color-primary)" }}
              >
                {link.icon}
              </span>
              <div>
                <p
                  className="font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {link.label}
                </p>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {link.description}
                </p>
              </div>
              <span
                className="material-symbols-outlined ml-auto text-lg"
                style={{ color: "var(--color-text-muted)" }}
              >
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
