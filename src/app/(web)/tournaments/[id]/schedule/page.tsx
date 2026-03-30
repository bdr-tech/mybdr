import { prisma } from "@/lib/db/prisma";
import { ScheduleTimeline } from "../_components/schedule-timeline";
import type { ScheduleMatch, ScheduleTeam } from "../_components/schedule-timeline";

export const revalidate = 30;

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 경기 목록 + 참가팀 목록을 병렬로 가져옴
  const [rawMatches, rawTeams] = await Promise.all([
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: { scheduledAt: "asc" },
      include: {
        homeTeam: { include: { team: { select: { name: true } } } },
        awayTeam: { include: { team: { select: { name: true } } } },
      },
    }),
    // 대회에 참가한 팀 목록 (필터용)
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      select: {
        id: true,
        team: { select: { name: true } },
      },
      orderBy: { team: { name: "asc" } },
    }),
  ]);

  // 클라이언트 컴포넌트에 넘기기 위해 직렬화 가능한 형태로 변환
  // (BigInt -> string, Date -> ISO string)
  const matches: ScheduleMatch[] = rawMatches.map((m) => ({
    id: m.id.toString(),
    homeTeamName: m.homeTeam?.team.name ?? null,
    awayTeamName: m.awayTeam?.team.name ?? null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    roundName: m.roundName,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    courtNumber: m.court_number,
  }));

  const teams: ScheduleTeam[] = rawTeams.map((t) => ({
    id: t.id.toString(),
    name: t.team.name,
  }));

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">일정</h1>
      {/* 타임라인 뷰 + 팀 필터 (클라이언트 컴포넌트) */}
      <ScheduleTimeline matches={matches} teams={teams} />
    </div>
  );
}
