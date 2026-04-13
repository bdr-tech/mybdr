// 대진표 페이지 - 대시보드 레이아웃
// 상단: 대시보드 헤더(통계 4칸)
// 본문: 2열 (좌측: 조별리그 순위표 + 대진표 트리, 우측: 사이드바)
// bracket-builder.ts 유틸리티는 절대 변경하지 않음

import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { buildRoundGroups } from "@/lib/tournaments/bracket-builder";
import { BracketView } from "./_components/bracket-view";
import { BracketEmpty } from "./_components/bracket-empty";
import { TournamentDashboardHeader } from "./_components/tournament-dashboard-header";
import { GroupStandings, type GroupTeam } from "./_components/group-standings";
import { FinalsSidebar } from "./_components/finals-sidebar";

export const revalidate = 30;

export default async function BracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 대회 기본 정보 조회 (사이드바에 필요한 venue, entry_fee 포함)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      format: true,
      venue_name: true,
      city: true,
      entry_fee: true,
    },
  });

  if (!tournament) return notFound();

  // 대진표 매치 데이터 조회
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
    include: {
      homeTeam: {
        include: {
          team: { select: { name: true, primaryColor: true } },
        },
      },
      awayTeam: {
        include: {
          team: { select: { name: true, primaryColor: true } },
        },
      },
    },
  });

  // 참가팀 데이터 조회 (조별리그 순위표 + 통계용)
  const tournamentTeams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    include: {
      team: { select: { name: true } },
    },
    orderBy: [{ wins: "desc" }, { losses: "asc" }],
  });

  // 진행중 경기 수 계산 (통계 카드용)
  const liveMatchCount = matches.filter(
    (m) => m.status === "in_progress"
  ).length;

  // 대시보드 진행률 카드용: 전체/완료 경기 수
  const totalMatches = matches.length;
  const completedMatches = matches.filter((m) => m.status === "completed").length;

  // 핫팀 계산: 경기 결과 기반 승률→득실차→다득점 1위 팀
  const teamStats: Record<string, {
    wins: number; losses: number;
    pointsFor: number; pointsAgainst: number;
    teamId: bigint; teamName: string;
  }> = {};
  for (const t of tournamentTeams) {
    teamStats[t.id.toString()] = {
      wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0,
      teamId: t.teamId, teamName: t.team.name,
    };
  }
  for (const m of matches) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    if (m.status !== "completed" && m.status !== "live") continue;
    const hid = m.homeTeamId.toString();
    const aid = m.awayTeamId.toString();
    const hs = m.homeScore ?? 0;
    const as_ = m.awayScore ?? 0;
    if (teamStats[hid]) { teamStats[hid].pointsFor += hs; teamStats[hid].pointsAgainst += as_; }
    if (teamStats[aid]) { teamStats[aid].pointsFor += as_; teamStats[aid].pointsAgainst += hs; }
    if (m.status === "completed" || m.status === "live") {
      if (hs > as_) { if (teamStats[hid]) teamStats[hid].wins++; if (teamStats[aid]) teamStats[aid].losses++; }
      else if (as_ > hs) { if (teamStats[aid]) teamStats[aid].wins++; if (teamStats[hid]) teamStats[hid].losses++; }
    }
  }
  const rankedTeams = Object.values(teamStats)
    .filter((t) => (t.wins + t.losses) > 0)
    .sort((a, b) => {
      const aRate = a.wins / (a.wins + a.losses);
      const bRate = b.wins / (b.wins + b.losses);
      if (bRate !== aRate) return bRate - aRate;
      const aDiff = a.pointsFor - a.pointsAgainst;
      const bDiff = b.pointsFor - b.pointsAgainst;
      if (bDiff !== aDiff) return bDiff - aDiff;
      return b.pointsFor - a.pointsFor;
    });
  const hotTeam = rankedTeams[0]
    ? { teamId: rankedTeams[0].teamId.toString(), teamName: rankedTeams[0].teamName }
    : null;

  // 결승전 예정일 계산 (마지막 라운드의 scheduledAt)
  const bracketMatchesAll = matches.filter(
    (m) => m.round_number != null && m.bracket_position != null
  );
  const finalsDate = bracketMatchesAll.length > 0
    ? (() => {
        // 가장 높은 라운드 번호의 매치에서 scheduledAt 추출
        const maxRound = Math.max(...bracketMatchesAll.map((m) => m.round_number!));
        const finalMatch = bracketMatchesAll.find(
          (m) => m.round_number === maxRound
        );
        return finalMatch?.scheduledAt?.toISOString() ?? null;
      })()
    : null;

  // 조별리그 순위표 데이터 변환
  // groupName이 있는 팀만 순위표에 표시
  const groupTeams: GroupTeam[] = tournamentTeams
    .filter((t) => t.groupName != null)
    .map((t) => ({
      id: t.id.toString(),
      teamName: t.team.name,
      groupName: t.groupName,
      wins: t.wins ?? 0,
      losses: t.losses ?? 0,
      draws: t.draws ?? 0,
      pointsFor: t.points_for ?? 0,
      pointsAgainst: t.points_against ?? 0,
      pointDifference: t.point_difference ?? 0,
    }));

  // 대진표가 없는 경우
  if (matches.length === 0) {
    return (
      <div>
        {/* 대시보드 헤더는 항상 표시 */}
        <TournamentDashboardHeader
          totalMatches={totalMatches}
          completedMatches={completedMatches}
          liveMatchCount={0}
          hotTeam={hotTeam}
        />

        {/* 조별리그 순위표 (데이터가 있으면 표시) */}
        {groupTeams.length > 0 && <GroupStandings teams={groupTeams} />}

        {/* 빈 대진표 안내 */}
        <BracketEmpty tournamentId={id} />
      </div>
    );
  }

  // bracket_position이 있는 매치만 대진표용으로 사용
  const bracketMatches = matches.filter(
    (m) => m.round_number != null && m.bracket_position != null
  );

  if (bracketMatches.length === 0) {
    return (
      <div>
        <TournamentDashboardHeader
          totalMatches={totalMatches}
          completedMatches={completedMatches}
          liveMatchCount={liveMatchCount}
          hotTeam={hotTeam}
        />

        {groupTeams.length > 0 && <GroupStandings teams={groupTeams} />}

        <BracketEmpty tournamentId={id} />
      </div>
    );
  }

  // DB 매치 -> 라운드 그룹 구조로 변환 (bracket-builder 유틸 그대로 사용)
  const rounds = buildRoundGroups(bracketMatches);

  return (
    <div>
      {/* 대시보드 헤더: 대형 제목 + 통계 4칸 */}
      <TournamentDashboardHeader
        totalMatches={totalMatches}
        completedMatches={completedMatches}
        liveMatchCount={liveMatchCount}
        hotTeam={hotTeam}
      />

      {/* 2열 레이아웃: 좌측 본문(조별리그+대진표) + 우측 사이드바 */}
      <div className="grid grid-cols-12 gap-4 sm:gap-8">
        {/* 좌측 본문 영역 */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* 조별리그 순위표 (그룹 데이터가 있을 때만) */}
          {groupTeams.length > 0 && <GroupStandings teams={groupTeams} />}

          {/* 대진표 트리 (기존 BracketView 로직 유지) */}
          <BracketView rounds={rounds} tournamentId={id} />
        </div>

        {/* 우측 사이드바 (데스크톱만) */}
        <div className="col-span-12 lg:col-span-4">
          <FinalsSidebar
            finalsDate={finalsDate}
            venueName={tournament.venue_name}
            city={tournament.city}
            entryFee={tournament.entry_fee ? Number(tournament.entry_fee) : null}
          />
        </div>
      </div>
    </div>
  );
}
