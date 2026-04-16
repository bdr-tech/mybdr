/**
 * 공식 기록 가드 유틸 (Phase 3)
 *
 * "공식 기록"으로 취급할 경기의 공통 조건을 한 곳에 모은다.
 * 왜 필요한가:
 *   - Flutter 앱이 미래 시각(예: id=120, 2030년) 테스트 데이터를 만드는 문제 방어
 *   - scheduledAt이 NULL인 더미/초안 경기 방어
 *   - 예정(scheduled) 상태는 아직 플레이 안 된 경기라 기록에 포함 금지
 *
 * 원칙:
 *   - status IN (completed, live)  → 예정은 제외, 진행 중은 현재 스코어로 인정
 *   - scheduledAt <= NOW()         → 미래 테스트 데이터 제외
 *   - scheduledAt IS NOT NULL      → 날짜 없는 더미/초안 제외
 */
import type { Prisma } from "@prisma/client";

/**
 * 공식 기록으로 취급할 TournamentMatch 조건.
 *
 * 사용 예:
 *   prisma.tournamentMatch.findMany({ where: officialMatchWhere({ homeTeamId: { in: ttIds } }) })
 *
 * @param extra 추가 조건 (OR, homeTeamId 등)을 합칠 때 사용
 */
export function officialMatchWhere(
  extra: Prisma.TournamentMatchWhereInput = {},
): Prisma.TournamentMatchWhereInput {
  return {
    ...extra,
    status: { in: ["completed", "live"] },
    scheduledAt: { lte: new Date(), not: null },
  };
}

/**
 * Nested filter용 (MatchPlayerStat → tournamentMatch 조인 시).
 *
 * 사용 예:
 *   prisma.matchPlayerStat.aggregate({
 *     where: {
 *       tournamentTeamPlayerId: { in: playerIds },
 *       tournamentMatch: officialMatchNestedFilter(),
 *     },
 *   })
 */
export function officialMatchNestedFilter(): Prisma.TournamentMatchWhereInput {
  return {
    status: { in: ["completed", "live"] },
    scheduledAt: { lte: new Date(), not: null },
  };
}

/**
 * scheduledAt 가드만 반환 (status는 호출자가 별도로 처리).
 *
 * 왜 필요한가: 호출자의 기존 status 조건이 [completed, in_progress, live] 처럼
 * 특수한 값을 쓰고 있어 그대로 유지해야 할 때, scheduledAt 미래방어만 필요함.
 *
 * 사용 예:
 *   where: {
 *     ...pastOrOngoingSchedule(),
 *     status: { in: ["completed", "in_progress", "live"] }, // 기존 값 유지
 *   }
 */
export function pastOrOngoingSchedule(): {
  scheduledAt: { lte: Date; not: null };
} {
  return { scheduledAt: { lte: new Date(), not: null } };
}

/**
 * Raw SQL용 조건 단편 (WHERE 절 뒤에 AND로 연결).
 *
 * 왜 필요한가: Prisma.sql 빌더 없이 템플릿 리터럴에 그대로 삽입해서 쓰는 케이스
 * (예: $queryRaw 안의 tournament_matches 조인 필터).
 *
 * tm = tournament_matches 테이블의 alias 기준. 다른 alias면 교체 필요.
 */
export const OFFICIAL_MATCH_SQL_CONDITION = `
  tm.status IN ('completed', 'live')
  AND tm.scheduled_at <= NOW()
  AND tm.scheduled_at IS NOT NULL
`;
