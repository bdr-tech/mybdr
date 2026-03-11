/**
 * Zod 스키마 필드명 → Prisma DB 컬럼명 매핑.
 * stats/route.ts (create/bulk) 와 stats/[stat_id]/route.ts (update) 에서 공통 사용.
 */

interface StatInput {
  points?: number | null;
  rebounds?: number | null;
  assists?: number | null;
  steals?: number | null;
  blocks?: number | null;
  turnovers?: number | null;
  fouls?: number | null;
  fieldGoalsMade?: number | null;
  fieldGoalsAttempted?: number | null;
  threePointersMade?: number | null;
  threePointersAttempted?: number | null;
  freeThrowsMade?: number | null;
  freeThrowsAttempted?: number | null;
  minutesPlayed?: number | null;
  isStarter?: boolean | null;
  plusMinus?: number | null;
}

/**
 * Zod 입력 → Prisma create/update data로 변환.
 * undefined 필드는 결과에서 제외되어 partial update에도 안전.
 */
export function mapStatToPrisma(s: StatInput): Record<string, unknown> {
  return {
    ...(s.points !== undefined && { points: s.points }),
    ...(s.rebounds !== undefined && { total_rebounds: s.rebounds }),
    ...(s.assists !== undefined && { assists: s.assists }),
    ...(s.steals !== undefined && { steals: s.steals }),
    ...(s.blocks !== undefined && { blocks: s.blocks }),
    ...(s.turnovers !== undefined && { turnovers: s.turnovers }),
    ...(s.fouls !== undefined && { personal_fouls: s.fouls }),
    ...(s.fieldGoalsMade !== undefined && { fieldGoalsMade: s.fieldGoalsMade }),
    ...(s.fieldGoalsAttempted !== undefined && { fieldGoalsAttempted: s.fieldGoalsAttempted }),
    ...(s.threePointersMade !== undefined && { threePointersMade: s.threePointersMade }),
    ...(s.threePointersAttempted !== undefined && { threePointersAttempted: s.threePointersAttempted }),
    ...(s.freeThrowsMade !== undefined && { freeThrowsMade: s.freeThrowsMade }),
    ...(s.freeThrowsAttempted !== undefined && { freeThrowsAttempted: s.freeThrowsAttempted }),
    ...(s.minutesPlayed !== undefined && { minutesPlayed: s.minutesPlayed }),
    ...(s.isStarter !== undefined && { isStarter: s.isStarter }),
    ...(s.plusMinus !== undefined && { plusMinus: s.plusMinus }),
  };
}
