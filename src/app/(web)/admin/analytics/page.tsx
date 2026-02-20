import { prisma } from "@/lib/db/prisma";
import { Card, StatCard } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    thisMonthUsers,
    thisMonthTournaments,
    thisMonthGames,
    totalUsers,
    totalTournaments,
    totalGames,
    monthlyUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),
    prisma.tournament.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),
    prisma.games.count({ where: { created_at: { gte: startOfMonth } } }).catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.tournament.count().catch(() => 0),
    prisma.games.count().catch(() => 0),
    // 최근 6개월 월별 유저 가입 수
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
      FROM users
      WHERE created_at >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `.catch(() => [] as { month: string; count: bigint }[]),
  ]);

  return {
    thisMonthUsers,
    thisMonthTournaments,
    thisMonthGames,
    totalUsers,
    totalTournaments,
    totalGames,
    monthlyUsers: monthlyUsers.map((r) => ({
      month: r.month,
      count: Number(r.count),
    })),
  };
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalytics();
  const maxCount = Math.max(...data.monthlyUsers.map((m) => m.count), 1);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">분석</h1>

      {/* 이번 달 통계 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="이번 달 가입"
          value={data.thisMonthUsers.toLocaleString()}
          icon={<span className="text-xl">📈</span>}
        />
        <StatCard
          label="이번 달 대회"
          value={data.thisMonthTournaments.toLocaleString()}
          icon={<span className="text-xl">🏆</span>}
        />
        <StatCard
          label="이번 달 경기"
          value={data.thisMonthGames.toLocaleString()}
          icon={<span className="text-xl">🏀</span>}
        />
      </div>

      {/* 누적 통계 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-[#A0A0A0]">전체 유저</p>
          <p className="mt-1 text-2xl font-bold">{data.totalUsers.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#A0A0A0]">전체 대회</p>
          <p className="mt-1 text-2xl font-bold">{data.totalTournaments.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#A0A0A0]">전체 경기</p>
          <p className="mt-1 text-2xl font-bold">{data.totalGames.toLocaleString()}</p>
        </Card>
      </div>

      {/* 월별 가입 추이 */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">월별 가입 추이 (최근 6개월)</h2>
        {data.monthlyUsers.length > 0 ? (
          <div className="flex h-48 items-end gap-3">
            {data.monthlyUsers.map((m) => {
              const heightPct = Math.round((m.count / maxCount) * 100);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-[#F4A261]">{m.count}</span>
                  <div className="flex w-full flex-col justify-end" style={{ height: "140px" }}>
                    <div
                      className="w-full rounded-t-[6px] bg-[#F4A261] transition-all"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#666666]">
                    {m.month.slice(5)}월
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-[#A0A0A0]">
            데이터가 없습니다.
          </div>
        )}
      </Card>
    </div>
  );
}
