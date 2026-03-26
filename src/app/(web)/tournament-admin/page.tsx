import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { Card, StatCard } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TournamentAdminDashboard() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const organizerId = BigInt(session.sub);

  type SeriesRow = { id: bigint; name: string; tournaments_count: number | null };

  const [total, active, completed, seriesCount, recentSeries]: [number, number, number, number, SeriesRow[]] = await Promise.all([
    prisma.tournament.count({ where: { organizerId } }),
    prisma.tournament.count({ where: { organizerId, status: { in: ["active", "registration"] } } }),
    prisma.tournament.count({ where: { organizerId, status: "completed" } }),
    prisma.tournament_series.count({ where: { organizer_id: organizerId } }),
    prisma.tournament_series.findMany({
      where: { organizer_id: organizerId },
      orderBy: { updated_at: "desc" },
      take: 3,
      select: { id: true, name: true, tournaments_count: true },
    }),
  ]).catch(() => [0, 0, 0, 0, []] as [number, number, number, number, SeriesRow[]]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>대회 관리 대시보드</h1>
        <Link href="/tournament-admin/tournaments/new/wizard" className="rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white">새 대회 만들기</Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="내 대회" value={total} icon={<span className="text-xl font-bold text-[var(--color-accent)]">T</span>} />
        <StatCard label="진행 중" value={active} icon={<span className="text-xl font-bold text-[var(--color-primary)]">L</span>} />
        <StatCard label="완료" value={completed} icon={<span className="text-xl font-bold text-[var(--color-accent)]">D</span>} />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">빠른 시작</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/tournament-admin/tournaments/new/wizard" className="rounded-[16px] bg-[var(--color-elevated)] p-4 text-center hover:bg-[var(--color-border)] transition-colors">
            <div className="mb-2 text-2xl font-bold text-[var(--color-accent)]">+</div>
            <p className="text-sm font-medium">대회 만들기</p>
          </Link>
          <Link href="/tournament-admin/tournaments" className="rounded-[16px] bg-[var(--color-elevated)] p-4 text-center hover:bg-[var(--color-border)] transition-colors">
            <div className="mb-2 text-2xl font-bold text-[var(--color-accent)]">=</div>
            <p className="text-sm font-medium">내 대회 목록</p>
          </Link>
          <Link href="/tournament-admin/templates" className="rounded-[16px] bg-[var(--color-elevated)] p-4 text-center hover:bg-[var(--color-border)] transition-colors">
            <div className="mb-2 text-2xl font-bold text-[var(--color-accent)]">T</div>
            <p className="text-sm font-medium">템플릿 둘러보기</p>
          </Link>
        </div>
      </Card>

      {/* 시리즈 섹션 */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">내 시리즈</h2>
          <Link href="/tournament-admin/series" className="text-xs text-[var(--color-accent)] hover:underline">
            전체 보기
          </Link>
        </div>

        {seriesCount > 0 && recentSeries.length > 0 ? (
          <div className="space-y-2">
            {recentSeries.map((s) => (
              <Link key={s.id.toString()} href={`/tournament-admin/series/${s.id}`}>
                <Card className="flex items-center justify-between hover:bg-[var(--color-elevated)] transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">총 {s.tournaments_count ?? 0}회차</p>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">→</span>
                </Card>
              </Link>
            ))}
            <Link
              href="/tournament-admin/series/new"
              className="mt-1 block rounded-[16px] border border-dashed border-[var(--color-border)] p-3 text-center text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
            >
              + 새 시리즈 만들기
            </Link>
          </div>
        ) : (
          <Card className="py-8 text-center text-[var(--color-text-muted)]">
            <div className="mb-2 text-lg font-semibold text-[var(--color-text-muted)]">Series</div>
            <p className="mb-3 text-sm">정기 대회를 시리즈로 관리해보세요.</p>
            <Link
              href="/tournament-admin/series/new"
              className="inline-block rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              첫 시리즈 만들기
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
