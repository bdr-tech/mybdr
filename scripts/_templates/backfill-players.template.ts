/**
 * [TEMPLATE] 대회 선수 userId 일회성 백필
 *
 * 시나리오:
 *   admin이 대회 참가팀/선수를 수기 등록 (userId=NULL)하고,
 *   이후 선수가 BDR 가입 → tournament_team_players.user_id 채우는 사후 복구.
 *
 * 사용법:
 *   1. 복사: `scripts/backfill-<alias>.ts`
 *   2. TOURNAMENT_ID 교체
 *   3. 드라이런: npx tsx scripts/backfill-<alias>.ts
 *   4. 실제 실행: npx tsx scripts/backfill-<alias>.ts --execute
 *   5. 완료 후 삭제
 *
 * 로직:
 *   - userId=NULL 선수 각각에 대해 users 테이블에서 nickname/name 정확 일치 검색
 *   - 정확히 1명 매칭 → UPDATE user_id
 *   - 0명 or 2명+ → skip (동명이인 수동 확인 필요)
 *   - 같은 대회팀에 이미 동일 userId 있으면 → skip (unique 제약 방어)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");

// ====== 파라미터 (교체 필요) ======
const TOURNAMENT_ID = "REPLACE-WITH-TOURNAMENT-UUID";

async function main() {
  const mode = EXECUTE ? "[EXECUTE]" : "[DRY RUN]";
  console.log(`${mode} 대회 ${TOURNAMENT_ID} 선수 userId 백필\n`);

  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: TOURNAMENT_ID },
    select: { id: true, team: { select: { name: true } } },
  });
  const teamIds = teams.map((t) => t.id);
  const teamNameById = new Map(teams.map((t) => [t.id, t.team?.name ?? "(unknown)"]));

  const targets = await prisma.tournamentTeamPlayer.findMany({
    where: { tournamentTeamId: { in: teamIds }, userId: null },
    select: { id: true, player_name: true, tournamentTeamId: true },
    orderBy: { tournamentTeamId: "asc" },
  });

  console.log(`대상 선수 (userId NULL): ${targets.length}명\n`);

  let matched = 0,
    noCand = 0,
    multiCand = 0,
    dupConflict = 0,
    missing = 0,
    updated = 0;
  const lines: string[] = [];

  for (const p of targets) {
    const teamLabel = teamNameById.get(p.tournamentTeamId) ?? "(?)";
    if (!p.player_name) {
      missing++;
      lines.push(`  ⚠️  [id=${p.id}] player_name 비어있음, skip`);
      continue;
    }

    const found = await prisma.$queryRawUnsafe<
      { id: bigint; nickname: string | null; name: string | null }[]
    >(
      `SELECT id, nickname, name FROM users WHERE nickname = $1 OR name = $1 LIMIT 5`,
      p.player_name
    );

    if (found.length === 0) {
      noCand++;
      lines.push(`  ❌ [${teamLabel}] ${p.player_name} → 후보 0명`);
      continue;
    }
    if (found.length > 1) {
      multiCand++;
      const ids = found.map((u) => u.id.toString()).join(", ");
      lines.push(`  ⚠️  [${teamLabel}] ${p.player_name} → 동명이인 ${found.length}명 (${ids}), skip`);
      continue;
    }

    const user = found[0];
    const dup = await prisma.tournamentTeamPlayer.findFirst({
      where: { tournamentTeamId: p.tournamentTeamId, userId: user.id },
      select: { id: true, player_name: true },
    });
    if (dup) {
      dupConflict++;
      lines.push(
        `  ⚠️  [${teamLabel}] ${p.player_name} → userId=${user.id} 이미 있음 ("${dup.player_name}"), skip`
      );
      continue;
    }

    matched++;
    lines.push(`  ✅ [${teamLabel}] ${p.player_name} → userId=${user.id}`);

    if (EXECUTE) {
      await prisma.tournamentTeamPlayer.update({
        where: { id: p.id },
        data: { userId: user.id },
      });
      updated++;
    }
  }

  console.log(lines.join("\n"));
  console.log("\n========================================");
  console.log(`${mode} 결과`);
  console.log("========================================");
  console.log(`✅ 매칭: ${matched}명`);
  console.log(`❌ 후보 0명: ${noCand}명`);
  console.log(`⚠️  동명이인: ${multiCand}명 (수동 확인 필요)`);
  console.log(`⚠️  중복 충돌: ${dupConflict}명`);
  console.log(`⚠️  이름 누락: ${missing}명`);
  if (EXECUTE) console.log(`\n💾 실제 UPDATE: ${updated}건`);
  else console.log(`\n💡 DRY RUN. --execute로 실제 실행`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
