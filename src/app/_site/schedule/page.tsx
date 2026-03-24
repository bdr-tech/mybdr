import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

const STATUS_LABEL: Record<string, string> = {
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
  pending: "대기",
};

export default async function SiteSchedulePage() {
  const headersList = await headers();
  const subdomain = headersList.get("x-tournament-subdomain");
  if (!subdomain) return notFound();

  const site = await prisma.tournamentSite.findUnique({
    where: { subdomain },
    select: { tournamentId: true, isPublished: true },
  });
  if (!site || !site.isPublished) return notFound();

  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: site.tournamentId },
    orderBy: [{ scheduledAt: "asc" }, { round_number: "asc" }, { bracket_position: "asc" }],
    include: {
      homeTeam: { include: { team: { select: { name: true, primaryColor: true } } } },
      awayTeam: { include: { team: { select: { name: true, primaryColor: true } } } },
    },
  });

  // 날짜별 그룹핑
  const grouped = matches.reduce<Record<string, typeof matches>>((acc, m) => {
    const key = m.scheduledAt
      ? m.scheduledAt.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })
      : "날짜 미정";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const dates = Object.keys(grouped);

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">경기 일정</h2>
      {dates.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-3xl">📅</div>
          등록된 경기 일정이 없습니다.
        </Card>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-muted)]">{date}</h3>
              <div className="space-y-2">
                {grouped[date].map((m) => (
                  <Card key={m.id.toString()}>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* 라운드 */}
                      <span className="w-20 shrink-0 text-xs text-[var(--color-text-muted)]">
                        {m.roundName ?? `라운드 ${m.round_number ?? "-"}`}
                      </span>

                      {/* 홈팀 */}
                      <div className="flex flex-1 items-center justify-end gap-2">
                        {m.homeTeam?.team.primaryColor && (
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: m.homeTeam.team.primaryColor }}
                          />
                        )}
                        <span
                          className={`font-semibold ${
                            m.winner_team_id && m.winner_team_id === m.homeTeamId
                              ? "text-[var(--color-primary)]"
                              : ""
                          }`}
                        >
                          {m.homeTeam?.team.name ?? "TBD"}
                        </span>
                      </div>

                      {/* 스코어 */}
                      <div className="flex items-center gap-1 text-center">
                        {m.status === "completed" || m.status === "in_progress" ? (
                          <span className="min-w-[4rem] rounded-[8px] bg-[var(--color-elevated)] px-3 py-1 font-mono font-bold">
                            {m.homeScore} : {m.awayScore}
                          </span>
                        ) : (
                          <span className="min-w-[4rem] text-center text-sm text-[var(--color-text-muted)]">
                            {m.scheduledAt
                              ? m.scheduledAt.toLocaleTimeString("ko-KR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "VS"}
                          </span>
                        )}
                      </div>

                      {/* 원정팀 */}
                      <div className="flex flex-1 items-center gap-2">
                        <span
                          className={`font-semibold ${
                            m.winner_team_id && m.winner_team_id === m.awayTeamId
                              ? "text-[var(--color-primary)]"
                              : ""
                          }`}
                        >
                          {m.awayTeam?.team.name ?? "TBD"}
                        </span>
                        {m.awayTeam?.team.primaryColor && (
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: m.awayTeam.team.primaryColor }}
                          />
                        )}
                      </div>

                      {/* 상태 */}
                      <Badge
                        variant={
                          m.status === "in_progress"
                            ? "error"
                            : m.status === "completed"
                            ? "info"
                            : "default"
                        }

                      >
                        {STATUS_LABEL[m.status ?? "pending"] ?? m.status}
                      </Badge>
                    </div>

                    {m.venue_name && (
                      <p className="mt-1 pl-24 text-xs text-[var(--color-text-muted)]">📍 {m.venue_name}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
