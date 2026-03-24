import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const TOURNAMENT_ID = "33d346d1-9f04-43c2-9d02-042ae0c0b1dd";

const teams = [
  { name: "근농사", color: "#FF6B35" },
  { name: "라곰", color: "#4A90D9" },
  { name: "레드핫", color: "#CC0000" },
  { name: "리바운드 YB", color: "#2ECC71" },
  { name: "팀제이에이치", color: "#8E44AD" },
  { name: "혼", color: "#E67E22" },
];

async function main() {
  console.log(`\n🏀 대회 팀 등록: ${TOURNAMENT_ID}\n`);

  for (const t of teams) {
    // 1. 팀 존재 확인
    const existing = await prisma.$queryRaw<{id: bigint}[]>`
      SELECT id FROM teams WHERE name = ${t.name} LIMIT 1
    `;

    let teamId: bigint;

    if (existing.length > 0) {
      teamId = existing[0].id;
      console.log(`ℹ️  팀 존재: ${t.name} (ID: ${teamId})`);
    } else {
      // 2. 팀 생성
      const uuid = randomUUID();
      await prisma.$executeRaw`
        INSERT INTO teams (uuid, name, primary_color, secondary_color, captain_id, created_at, updated_at)
        VALUES (${uuid}, ${t.name}, ${t.color}, '#000000', 7, NOW(), NOW())
      `;
      const created = await prisma.$queryRaw<{id: bigint}[]>`
        SELECT id FROM teams WHERE uuid = ${uuid} LIMIT 1
      `;
      teamId = created[0].id;
      console.log(`✅ 팀 생성: ${t.name} (ID: ${teamId})`);
    }

    // 3. 대회 등록 확인
    const ttExists = await prisma.$queryRaw<{id: bigint}[]>`
      SELECT id FROM tournament_teams
      WHERE tournament_id = ${TOURNAMENT_ID}::uuid AND team_id = ${teamId}
      LIMIT 1
    `;

    if (ttExists.length > 0) {
      console.log(`   → 이미 대회 등록됨`);
    } else {
      await prisma.$executeRaw`
        INSERT INTO tournament_teams (tournament_id, team_id, status, registered_by_id, approved_at, created_at, updated_at)
        VALUES (${TOURNAMENT_ID}::uuid, ${teamId}, 'approved', 7, NOW(), NOW(), NOW())
      `;
      await prisma.$executeRaw`
        UPDATE tournaments SET teams_count = teams_count + 1 WHERE id = ${TOURNAMENT_ID}::uuid
      `;
      console.log(`   → 대회 등록 완료 ✅`);
    }
  }

  console.log(`\n🎉 완료! 총 ${teams.length}팀 처리\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
