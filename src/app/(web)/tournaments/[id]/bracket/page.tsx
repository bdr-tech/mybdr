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
          tournamentName={tournament.name}
          totalTeams={tournamentTeams.length}
          liveMatchCount={0}
          finalsDate={null}
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
          tournamentName={tournament.name}
          totalTeams={tournamentTeams.length}
          liveMatchCount={liveMatchCount}
          finalsDate={null}
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
        tournamentName={tournament.name}
        totalTeams={tournamentTeams.length}
        liveMatchCount={liveMatchCount}
        finalsDate={finalsDate}
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
