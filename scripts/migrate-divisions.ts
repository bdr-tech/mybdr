/**
 * 기존 대회의 자연어 divisions를 BDR 표준 코드로 매핑하는 마이그레이션 스크립트
 *
 * 동작 순서:
 * 1. 모든 대회 조회
 * 2. 각 대회의 divisions JSON 파싱
 * 3. 자연어를 표준 코드로 매핑 (division_tiers + categories 업데이트)
 * 4. DB 업데이트 (변경 전/후 콘솔 출력)
 * 5. 매핑 불가능한 것은 그대로 유지 + 경고
 *
 * 실행: npx tsx scripts/migrate-divisions.ts
 * 드라이런: npx tsx scripts/migrate-divisions.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const isDryRun = process.argv.includes("--dry-run");

// ─── 자연어 → 표준 디비전 코드 매핑 테이블 ──────────────
// key: DB에 저장된 자연어 값 (소문자 비교용)
// value: { division: 표준코드 | null, category: 종별코드 | null }
const DIVISION_MAP: Record<string, { division: string | null; category: string | null }> = {
  // 일반부 계열 → category만 설정 (디비전 특정 불가)
  "일반부": { division: null, category: "general" },
  "일반": { division: null, category: "general" },

  // 대학부 계열
  "대학부": { division: null, category: "university" },
  "비입상 대학 동아리(비선출)": { division: null, category: "university" },

  // 시니어 계열
  "40대부": { division: null, category: "senior" },

  // 성별 표기 (종별이 아닌 성별 → gender 힌트로만 사용, category는 general로 분류)
  "여성부": { division: null, category: "general" },

  // 유소년 계열
  "유소년부": { division: null, category: "youth" },

  // D 시리즈 (일반부 세부 디비전)
  "D3부": { division: "D3", category: "general" },
  "D4부": { division: "D4", category: "general" },
  "D5부": { division: "D5", category: "general" },
  "D6부": { division: "D6", category: "general" },
  "D7부": { division: "D7", category: "general" },
  "D8부": { division: "D8", category: "general" },
  "디비전3부": { division: "D3", category: "general" },
  "디비전4부": { division: "D4", category: "general" },
  "디비전5부": { division: "D5", category: "general" },
  "디비전6부": { division: "D6", category: "general" },
  "디비전7부": { division: "D7", category: "general" },
  "디비전8부": { division: "D8", category: "general" },
};

// ─── 메인 실행 ───────────────────────────────────────────
async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  BDR 디비전 마이그레이션 ${isDryRun ? "(DRY RUN - DB 변경 없음)" : "(실제 실행)"}`);
  console.log(`${"=".repeat(60)}\n`);

  // 모든 대회 조회
  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      name: true,
      divisions: true,
      division_tiers: true,
      categories: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`총 ${tournaments.length}개 대회 조회됨\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let warningCount = 0;

  for (const t of tournaments) {
    // divisions JSON 파싱 (문자열이면 파싱, 배열이면 그대로)
    let rawDivisions: string[] = [];
    if (typeof t.divisions === "string") {
      try {
        rawDivisions = JSON.parse(t.divisions);
      } catch {
        rawDivisions = [t.divisions];
      }
    } else if (Array.isArray(t.divisions)) {
      rawDivisions = t.divisions as string[];
    }

    // division_tiers JSON 파싱
    let rawTiers: string[] = [];
    if (typeof t.division_tiers === "string") {
      try {
        rawTiers = JSON.parse(t.division_tiers);
      } catch {
        rawTiers = [t.division_tiers];
      }
    } else if (Array.isArray(t.division_tiers)) {
      rawTiers = t.division_tiers as string[];
    }

    // 기존 categories 파싱
    let existingCategories: Record<string, unknown> = {};
    if (t.categories && typeof t.categories === "object" && !Array.isArray(t.categories)) {
      existingCategories = t.categories as Record<string, unknown>;
    }

    // divisions가 비어있으면 스킵
    if (rawDivisions.length === 0 && rawTiers.length === 0) {
      skippedCount++;
      continue;
    }

    // 매핑 결과 수집
    const newDivisionTiers: string[] = [...rawTiers]; // 기존 tiers 유지
    const newCategories: Record<string, boolean> = {};
    const unmapped: string[] = [];

    // 기존 categories 유지
    for (const [key, val] of Object.entries(existingCategories)) {
      if (typeof val === "boolean") {
        newCategories[key] = val;
      }
    }

    for (const raw of rawDivisions) {
      const trimmed = raw.trim();
      const mapping = DIVISION_MAP[trimmed];

      if (mapping) {
        // 매핑 성공
        if (mapping.division) {
          // 구체적 디비전 코드가 있으면 division_tiers에 추가
          if (!newDivisionTiers.includes(mapping.division)) {
            newDivisionTiers.push(mapping.division);
          }
        }
        if (mapping.category) {
          // 종별 카테고리 설정
          newCategories[mapping.category] = true;
        }
      } else {
        // 매핑 불가 → 경고 + division_tiers에 원본 유지
        unmapped.push(trimmed);
        if (!newDivisionTiers.includes(trimmed)) {
          newDivisionTiers.push(trimmed);
        }
        warningCount++;
      }
    }

    // 변경사항이 있는지 확인
    const divisionsChanged =
      JSON.stringify(newDivisionTiers) !== JSON.stringify(rawTiers) ||
      JSON.stringify(newCategories) !== JSON.stringify(existingCategories);

    if (!divisionsChanged) {
      skippedCount++;
      continue;
    }

    // 변경 전/후 출력
    console.log(`[${t.name}] (ID: ${String(t.id)})`);
    console.log(`  변경 전:`);
    console.log(`    divisions: ${JSON.stringify(rawDivisions)}`);
    console.log(`    division_tiers: ${JSON.stringify(rawTiers)}`);
    console.log(`    categories: ${JSON.stringify(existingCategories)}`);
    console.log(`  변경 후:`);
    console.log(`    divisions: [] (표준화됨 → division_tiers/categories로 이동)`);
    console.log(`    division_tiers: ${JSON.stringify(newDivisionTiers)}`);
    console.log(`    categories: ${JSON.stringify(newCategories)}`);
    if (unmapped.length > 0) {
      console.log(`  ⚠ 매핑 불가 (원본 유지): ${unmapped.join(", ")}`);
    }
    console.log("");

    // DB 업데이트 (드라이런이 아닐 때만)
    if (!isDryRun) {
      await prisma.tournament.update({
        where: { id: t.id },
        data: {
          // divisions는 빈 배열로 초기화 (표준화된 데이터는 division_tiers/categories에)
          divisions: [],
          division_tiers: newDivisionTiers,
          categories: newCategories,
        },
      });
    }

    updatedCount++;
  }

  // 결과 요약
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  결과 요약`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  전체 대회: ${tournaments.length}개`);
  console.log(`  업데이트: ${updatedCount}개`);
  console.log(`  스킵 (변경 없음): ${skippedCount}개`);
  console.log(`  매핑 불가 경고: ${warningCount}건`);
  if (isDryRun) {
    console.log(`\n  ⚠ DRY RUN 모드 - 실제 DB는 변경되지 않았습니다.`);
    console.log(`  실제 실행: npx tsx scripts/migrate-divisions.ts`);
  }
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("마이그레이션 실패:", e);
  await prisma.$disconnect();
  process.exit(1);
});
