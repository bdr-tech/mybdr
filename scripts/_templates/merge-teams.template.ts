/**
 * [TEMPLATE] Team 소프트 병합
 *
 * 시나리오:
 *   같은 팀인데 Team 레코드가 중복 생성된 경우 (예: 원조 팀 + 대회용 임시 팀).
 *   keep 팀에 FK를 모두 UPDATE하고, drop 팀은 status="merged"로 소프트 비활성화.
 *
 * 사용법:
 *   1. 복사: `scripts/merge-teams-<alias>.ts`
 *   2. MERGES 배열에 {keep, drop, dropName} 추가
 *   3. 드라이런: npx tsx scripts/merge-teams-<alias>.ts
 *   4. 실제 실행: npx tsx scripts/merge-teams-<alias>.ts --execute
 *   5. 완료 후 삭제
 *
 * FK 이관 대상 테이블:
 *   - team_members (status 유지), tournament_teams, team_join_requests
 *   - team_member_histories (team_id, from_team_id, to_team_id 3컬럼)
 *   - community_posts, tournaments.champion_team_id
 *
 * 데이터 보존 원칙: DELETE 절대 금지, 전부 UPDATE + soft deactivation.
 * 사전 체크 필수: drop 팀의 TeamMember가 0명이어야 안전. 있으면 별도 처리.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");

// ====== 파라미터 (교체 필요) ======
const MERGES: { keep: bigint; drop: bigint; dropName: string }[] = [
  // { keep: 196n, drop: 209n, dropName: "경기 셋업" },
];

async function main() {
  const mode = EXECUTE ? "[EXECUTE]" : "[DRY RUN]";
  console.log(`${mode} 팀 병합\n`);

  if (MERGES.length === 0) {
    console.log("❌ MERGES 배열이 비어있음. 파라미터 교체 필요.");
    return;
  }

  for (const m of MERGES) {
    console.log("════════════════════════════════════════");
    console.log(`pair: keep=${m.keep} ← drop=${m.drop} "${m.dropName}"`);
    console.log("════════════════════════════════════════");

    // 사전 카운트
    const tt = await prisma.tournamentTeam.count({ where: { teamId: m.drop } });
    const tm = await prisma.teamMember.count({ where: { teamId: m.drop } });
    const [jr] = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
      `SELECT COUNT(*)::bigint AS c FROM team_join_requests WHERE team_id = $1`,
      m.drop
    );
    const [mh] = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
      `SELECT COUNT(*)::bigint AS c FROM team_member_histories WHERE team_id=$1 OR from_team_id=$1 OR to_team_id=$1`,
      m.drop
    );
    const [cp] = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
      `SELECT COUNT(*)::bigint AS c FROM community_posts WHERE team_id=$1`,
      m.drop
    );
    const [ch] = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
      `SELECT COUNT(*)::bigint AS c FROM tournaments WHERE champion_team_id=$1`,
      m.drop
    );

    console.log(`  사전 카운트:`);
    console.log(`    TournamentTeam: ${tt}`);
    console.log(`    TeamMember   : ${tm} (0이 안전, 아니면 중복 user 사전 처리 필요)`);
    console.log(`    join_requests: ${jr?.c ?? 0n}`);
    console.log(`    member_hist  : ${mh?.c ?? 0n}`);
    console.log(`    community    : ${cp?.c ?? 0n}`);
    console.log(`    champion_team: ${ch?.c ?? 0n}`);

    if (tm > 0) {
      console.log(
        `  ⚠️  TeamMember가 ${tm}명 있음. 중복 user 체크 먼저 필요 (keep 팀과 겹치면 unique 제약).`
      );
    }

    // keep 팀 로고 체크 (UI 컨텐츠 이관)
    const [keepTeam] = await prisma.$queryRawUnsafe<
      { name: string | null; logo_url: string | null }[]
    >(`SELECT name, logo_url FROM teams WHERE id=$1`, m.keep);
    const [dropTeam] = await prisma.$queryRawUnsafe<
      { name: string | null; logo_url: string | null }[]
    >(`SELECT name, logo_url FROM teams WHERE id=$1`, m.drop);

    console.log(`  keep: "${keepTeam?.name}" (logo: ${keepTeam?.logo_url ?? "(없음)"})`);
    console.log(`  drop: "${dropTeam?.name}" (logo: ${dropTeam?.logo_url ?? "(없음)"})`);

    let logoTransferNeeded = false;
    if (!keepTeam?.logo_url && dropTeam?.logo_url) {
      logoTransferNeeded = true;
      console.log(`  ℹ️  keep 팀에 logo 없음 → drop 팀 logo 이관 권장 (${dropTeam.logo_url})`);
    }

    if (!EXECUTE) {
      console.log(`  💡 DRY RUN — 실제 변경 없음\n`);
      continue;
    }

    // 트랜잭션 실행
    const result = await prisma.$transaction(async (tx) => {
      const r1 = await tx.tournamentTeam.updateMany({
        where: { teamId: m.drop },
        data: { teamId: m.keep },
      });
      const r2 = await tx.teamMember.updateMany({
        where: { teamId: m.drop },
        data: { teamId: m.keep },
      });
      const r3 = await tx.$executeRawUnsafe(
        `UPDATE team_join_requests SET team_id=$1 WHERE team_id=$2`,
        m.keep,
        m.drop
      );
      const r4a = await tx.$executeRawUnsafe(
        `UPDATE team_member_histories SET team_id=$1 WHERE team_id=$2`,
        m.keep,
        m.drop
      );
      const r4b = await tx.$executeRawUnsafe(
        `UPDATE team_member_histories SET from_team_id=$1 WHERE from_team_id=$2`,
        m.keep,
        m.drop
      );
      const r4c = await tx.$executeRawUnsafe(
        `UPDATE team_member_histories SET to_team_id=$1 WHERE to_team_id=$2`,
        m.keep,
        m.drop
      );
      const r5 = await tx.$executeRawUnsafe(
        `UPDATE community_posts SET team_id=$1 WHERE team_id=$2`,
        m.keep,
        m.drop
      );
      const r6 = await tx.$executeRawUnsafe(
        `UPDATE tournaments SET champion_team_id=$1 WHERE champion_team_id=$2`,
        m.keep,
        m.drop
      );

      // logo 이관 (keep이 비어있고 drop에 있을 때만)
      if (logoTransferNeeded && dropTeam?.logo_url) {
        await tx.$executeRawUnsafe(
          `UPDATE teams SET logo_url=$1, updated_at=NOW() WHERE id=$2`,
          dropTeam.logo_url,
          m.keep
        );
      }

      // drop 팀 soft 비활성화
      const newName = `[merged→${m.keep}] ${dropTeam?.name ?? m.dropName}`;
      const r7 = await tx.$executeRawUnsafe(
        `UPDATE teams SET name=$1, is_public=false, status='merged', updated_at=NOW() WHERE id=$2`,
        newName,
        m.drop
      );

      return {
        tt: r1.count,
        tm: r2.count,
        jr: r3,
        mh: Number(r4a) + Number(r4b) + Number(r4c),
        cp: r5,
        ch: r6,
        t: r7,
        logo: logoTransferNeeded ? 1 : 0,
      };
    });

    console.log(`\n  ✅ 실행 결과:`);
    console.log(`    TournamentTeam    : ${result.tt}`);
    console.log(`    TeamMember        : ${result.tm}`);
    console.log(`    join_requests     : ${result.jr}`);
    console.log(`    member_histories  : ${result.mh}`);
    console.log(`    community_posts   : ${result.cp}`);
    console.log(`    champion_team     : ${result.ch}`);
    console.log(`    logo 이관         : ${result.logo}`);
    console.log(`    team 비활성화     : ${result.t}\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
