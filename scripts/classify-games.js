/**
 * 경기 타입 자동 분류 스크립트
 * 크롤링 데이터 삽입 후 실행: node scripts/classify-games.js
 *
 * 0 = 픽업, 1 = 게스트 모집, 2 = 팀 대결
 */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

// 1순위: 제목 키워드
const TITLE_RULES = [
  // 팀 대결 (2)
  { keywords: ["교류전", "팀 초청", "한 팀", "한팀", "원정팀", "초청팀", "연습경기 초청", "연습경기 팀", "초청합니다"], type: 2 },
  // 게스트 모집 (1)
  { keywords: ["게스트", "게스트 모집", "게스트 초청", "게스트 구"], type: 1 },
  // 픽업 (0)
  { keywords: ["픽업", "자유참가", "오픈런", "픽업게임"], type: 0 },
];

// 2순위: 본문 키워드
const BODY_RULES = [
  { keywords: ["초청팀 구합니다", "연습경기 초청", "팀 초청", "초청 팀"], type: 2 },
  { keywords: ["게스트 혼합", "게스트 참여", "게스트 모집 인원", "게스트 비용"], type: 1 },
];

function classify(title, description) {
  const t = (title || "").toLowerCase();
  const d = (description || "").toLowerCase();

  // 1순위: 제목
  for (const rule of TITLE_RULES) {
    if (rule.keywords.some((kw) => t.includes(kw.toLowerCase()))) {
      return rule.type;
    }
  }

  // 2순위: 본문
  for (const rule of BODY_RULES) {
    if (rule.keywords.some((kw) => d.includes(kw.toLowerCase()))) {
      return rule.type;
    }
  }

  // 3순위: 기본값 — 게스트 모집
  return 1;
}

async function main() {
  const games = await p.$queryRawUnsafe(
    "SELECT id, title, description, game_type FROM games ORDER BY id"
  );

  let changed = 0;
  for (const g of games) {
    const newType = classify(g.title, g.description);
    if (g.game_type !== newType) {
      await p.$executeRawUnsafe(
        `UPDATE games SET game_type = ${newType} WHERE id = ${g.id}`
      );
      console.log(
        `${g.id}: ${g.game_type}→${newType} | ${(g.title || "").substring(0, 50)}`
      );
      changed++;
    }
  }

  console.log(`\n완료: ${changed}건 변경 / 전체 ${games.length}건`);

  const dist = await p.$queryRawUnsafe(
    "SELECT game_type, count(*) as cnt FROM games GROUP BY game_type ORDER BY game_type"
  );
  console.log("\n분포:");
  const labels = { 0: "픽업", 1: "게스트 모집", 2: "팀 대결" };
  dist.forEach((c) =>
    console.log(`  ${labels[c.game_type] || c.game_type}: ${c.cnt}건`)
  );

  await p.$disconnect();
}

main().catch(console.error);
