import { prisma } from "@/lib/db/prisma";
import { StatCard, Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// FR-060: Admin 대시보드
export default async function AdminDashboard() {
  const [userCount, tournamentCount, matchCount, teamCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.tournamentMatch.count({ where: { status: "live" } }),
      prisma.team.count(),
    ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>대시보드</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="전체 유저" value={userCount} icon={<span className="text-xl font-bold text-[var(--color-accent)]">U</span>} />
        <StatCard label="토너먼트" value={tournamentCount} icon={<span className="text-xl font-bold text-[var(--color-accent)]">T</span>} />
        <StatCard label="진행 중 경기" value={matchCount} icon={<span className="text-xl font-bold text-[var(--color-primary)]">L</span>} />
        <StatCard label="등록 팀" value={teamCount} icon={<span className="text-xl font-bold text-[var(--color-accent)]">TM</span>} />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">최근 활동</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          관리자 활동 로그가 여기에 표시됩니다.
        </p>
      </Card>
    </div>
  );
}
