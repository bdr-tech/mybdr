/**
 * 레거시 format 값을 새 4종으로 일괄 변환하는 마이그레이션 스크립트
 *
 * 실행: npx tsx scripts/migrate-formats.ts
 *
 * 변환 규칙:
 *   single_elimination → single_elimination (유지)
 *   double_elimination → dual_tournament
 *   round_robin        → full_league_knockout
 *   group_stage        → group_stage_knockout
 *   swiss              → group_stage_knockout
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 레거시 format → 새 format 매핑
const FORMAT_MAP: Record<string, string> = {
  double_elimination: "dual_tournament",
  round_robin: "full_league_knockout",
  group_stage: "group_stage_knockout",
  swiss: "group_stage_knockout",
};

async function main() {
  console.log("=== format 마이그레이션 시작 ===\n");

  // 변환 대상인 레거시 format 값 목록
  const legacyFormats = Object.keys(FORMAT_MAP);

  // 현재 DB에 있는 format 분포 확인
  const allTournaments = await prisma.tournament.findMany({
    select: { id: true, name: true, format: true },
  });

  console.log(`전체 대회 수: ${allTournaments.length}`);

  // format별 개수 집계
  const formatCounts: Record<string, number> = {};
  for (const t of allTournaments) {
    const f = t.format ?? "(null)";
    formatCounts[f] = (formatCounts[f] ?? 0) + 1;
  }
  console.log("현재 format 분포:", formatCounts);

  // 변환 대상 필터링
  const targets = allTournaments.filter(
    (t) => t.format && legacyFormats.includes(t.format)
  );

  if (targets.length === 0) {
    console.log("\n변환할 대회가 없습니다. 이미 최신 format입니다.");
    return;
  }

  console.log(`\n변환 대상: ${targets.length}건`);

  // 하나씩 업데이트 (건수가 적으므로 배치 불필요)
  for (const t of targets) {
    const oldFormat = t.format!;
    const newFormat = FORMAT_MAP[oldFormat];
    console.log(`  [${t.id}] "${t.name}" : ${oldFormat} → ${newFormat}`);

    await prisma.tournament.update({
      where: { id: t.id },
      data: { format: newFormat },
    });
  }

  console.log(`\n=== 마이그레이션 완료: ${targets.length}건 변환 ===`);
}

main()
  .catch((e) => {
    console.error("마이그레이션 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
