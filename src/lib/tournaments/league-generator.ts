import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

/**
 * 풀리그(라운드 로빈) 경기 자동 생성 유틸
 *
 * 참가팀 N개가 서로 한 번씩 맞붙는 N*(N-1)/2 개의 경기를 일괄 생성한다.
 * - 예: 8팀 → 28경기
 * - 경기는 status="scheduled", homeScore=0, awayScore=0, scheduledAt=null 로 생성
 * - round_number / bracket_position 은 null (리그는 라운드 개념 없음)
 * - match_number 는 1부터 순차 증가
 *
 * 이유: single_elimination 용 bracket-generator 와는 생성 패턴이 완전히 다르므로
 * 기존 로직을 건드리지 않고 독립된 유틸 파일을 둔다.
 */

/** 생성 옵션 */
export type GenerateLeagueOptions = {
  /** true 면 기존 경기 전부 삭제 후 재생성, false 면 기존 경기 있으면 에러 */
  clear?: boolean;
};

/** 생성 결과 */
export type GenerateLeagueResult = {
  matchesCreated: number;
  teamCount: number;
};

/**
 * 풀리그 경기 자동 생성 (본체)
 *
 * @param tournamentId - 대회 ID (UUID)
 * @param options - clear: true 면 기존 경기 삭제 후 재생성
 * @returns 생성된 경기 수 + 참가팀 수
 * @throws TEAMS_INSUFFICIENT / ALREADY_EXISTS (bracket API 와 동일한 에러코드 패턴)
 */
export async function generateRoundRobinMatches(
  tournamentId: string,
  options: GenerateLeagueOptions = {}
): Promise<GenerateLeagueResult> {
  // 트랜잭션 + advisory lock 으로 동시 생성 race condition 방지
  // (기존 bracket/route.ts 의 single_elimination 생성 패턴과 동일)
  return await prisma.$transaction(
    async (tx) => {
      // 1) 대회 단위 advisory lock — 같은 대회에 동시 생성 요청이 와도 직렬화됨
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${tournamentId})::bigint)`;

      // 2) 승인된(approved) 참가팀만 조회 — 시드 번호 순으로 정렬
      //    시드가 없으면 생성 순서대로
      const teams = await tx.tournamentTeam.findMany({
        where: { tournamentId, status: "approved" },
        orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
        select: { id: true, seedNumber: true },
      });

      if (teams.length < 2) {
        // 경기를 만들려면 최소 2팀 필요 (1팀끼리는 경기 불성립)
        throw Object.assign(new Error("TEAMS_INSUFFICIENT"), {
          code: "TEAMS_INSUFFICIENT",
        });
      }

      // 3) clear 옵션 처리: 재생성 모드면 기존 경기 전부 삭제, 아니면 중복 생성 방지
      if (options.clear) {
        await tx.tournamentMatch.deleteMany({ where: { tournamentId } });
      } else {
        const existing = await tx.tournamentMatch.count({
          where: { tournamentId },
        });
        if (existing > 0) {
          throw Object.assign(new Error("ALREADY_EXISTS"), {
            code: "ALREADY_EXISTS",
          });
        }
      }

      // 4) 모든 팀 쌍 조합 생성 (i < j) — N*(N-1)/2 경기
      //    이유: i==j 는 자기 자신, (i,j) 와 (j,i) 는 같은 경기이므로 한 방향만 생성
      const matchData: Prisma.TournamentMatchCreateManyInput[] = [];
      let matchNumber = 1;

      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matchData.push({
            tournamentId,
            homeTeamId: teams[i].id, // 시드가 앞선 팀이 홈 (시각적 일관성)
            awayTeamId: teams[j].id,
            status: "scheduled", // 풀리그는 전부 "예정" 상태로 시작
            homeScore: 0,
            awayScore: 0,
            // round_number / bracket_position / bracket_level 은 null (리그 특성)
            match_number: matchNumber++, // 1부터 순차 증가
            roundName: null, // 리그는 라운드명 없음
            scheduledAt: null, // 일정은 추후 관리자가 지정
          });
        }
      }

      // 5) 대량 insert — 쿼리 1회로 처리 (성능)
      await tx.tournamentMatch.createMany({ data: matchData });

      // 6) Tournament.matches_count 캐시 업데이트 (bracket API 와 동일 패턴)
      const total = await tx.tournamentMatch.count({ where: { tournamentId } });
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { matches_count: total },
      });

      return {
        matchesCreated: matchData.length,
        teamCount: teams.length,
      };
    },
    { timeout: 30000 } // 8팀이면 28건이라 빠르지만, 32팀(496경기) 대비 여유 타임아웃
  );
}

/**
 * 풀리그 경기 전체 삭제 (재생성 전 수동 사용 용도)
 *
 * @param tournamentId - 대회 ID
 * @returns 삭제된 경기 수
 */
export async function deleteAllLeagueMatches(
  tournamentId: string
): Promise<number> {
  const result = await prisma.tournamentMatch.deleteMany({
    where: { tournamentId },
  });
  return result.count;
}

/**
 * 해당 대회 format 이 풀리그 계열인지 확인
 * (round_robin / full_league / full_league_knockout 은 리그 경기부터 먼저 생성)
 */
export function isLeagueFormat(format: string | null | undefined): boolean {
  if (!format) return false;
  return (
    format === "round_robin" ||
    format === "full_league" ||
    format === "full_league_knockout"
  );
}
