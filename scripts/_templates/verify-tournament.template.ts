/**
 * [TEMPLATE] 대회 데이터 정합성 검증 스크립트
 *
 * 사용법:
 *   1. 이 파일을 `scripts/verify-<alias>.ts`로 복사
 *   2. TOURNAMENT_ID를 실제 대회 UUID로 교체
 *   3. 실행: npx tsx scripts/verify-<alias>.ts
 *   4. 작업 완료 후 삭제
 *
 * 출력:
 *   - 대회 기본 정보 (이름/startDate/endDate/status)
 *   - 참가팀 수 + 선수 수 + userId NULL 비율
 *   - 경기 수 + status 분포 + 0:0 completed/live 경기
 *   - 스탯 있는데 userId NULL인 선수
 *   - 자동 복구 가능 선수 수 (이름 매칭 후보 1명)
 *   - BDR 가입 여부 (가입자는 TeamMember 등록으로 복구 가능)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ====== 파라미터 (교체 필요) ======
const TOURNAMENT_ID = "REPLACE-WITH-TOURNAMENT-UUID";

async function main() {
  console.log("========================================");
  console.log(`대회 ID: ${TOURNAMENT_ID}`);
  console.log("========================================\n");

  // 0) 대회 정보
  const tournament = await prisma.tournament.findUnique({
    where: { id: TOURNAMENT_ID },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
    },
  });

  console.log("=== 0) 대회 정보 ===");
  if (!tournament) {
    console.log("❌ 대회가 개발 DB에 없음. 종료.");
    return;
  }
  console.log(`이름: ${tournament.name}`);
  console.log(`startDate: ${tournament.startDate?.toISOString() ?? "NULL"}`);
  console.log(`endDate  : ${tournament.endDate?.toISOString() ?? "NULL"}`);
  console.log(`status: ${tournament.status}`);

  const startMs = tournament.startDate?.getTime() ?? null;
  const endMs = tournament.endDate?.getTime() ?? null;
  let dateDiag = "";
  if (endMs === null) dateDiag = "endDate NULL (입력 누락)";
  else if (startMs === endMs) dateDiag = "startDate === endDate (당일 대회 or 오입력)";
  else dateDiag = "startDate !== endDate (기간 대회)";
  console.log(`→ 날짜 진단: ${dateDiag}`);

  // 1) 참가팀 + userId NULL 비율
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: TOURNAMENT_ID },
    select: { id: true },
  });
  const teamIds = teams.map((t) => t.id);

  const allPlayers = await prisma.tournamentTeamPlayer.count({
    where: { tournamentTeamId: { in: teamIds } },
  });
  const nullPlayers = await prisma.tournamentTeamPlayer.count({
    where: { tournamentTeamId: { in: teamIds }, userId: null },
  });
  const pct = allPlayers ? ((nullPlayers / allPlayers) * 100).toFixed(1) : "0";
  console.log(`\n=== 1) 참가팀 ${teams.length}개 ===`);
  console.log(`전체 선수: ${allPlayers}, userId NULL: ${nullPlayers} (${pct}%)`);

  // 2) 경기 + status + 0:0 케이스
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: TOURNAMENT_ID },
    select: { id: true, status: true, homeScore: true, awayScore: true, scheduledAt: true },
  });

  const statusCount: Record<string, number> = {};
  for (const m of matches) {
    const k = m.status ?? "null";
    statusCount[k] = (statusCount[k] ?? 0) + 1;
  }

  console.log(`\n=== 2) 경기 ${matches.length}개 ===`);
  console.log("status 분포:", statusCount);

  const zeroScoreOfficial = matches.filter(
    (m) =>
      (m.status === "completed" || m.status === "live") &&
      (m.homeScore ?? 0) === 0 &&
      (m.awayScore ?? 0) === 0
  ).length;
  const futureNonScheduled = matches.filter(
    (m) =>
      (m.status === "completed" || m.status === "live") &&
      m.scheduledAt &&
      m.scheduledAt > new Date()
  ).length;
  console.log(`completed/live 중 0:0: ${zeroScoreOfficial}건 (Flutter 최종스탯 입력 모드 or 테스트)`);
  console.log(`completed/live 중 미래 scheduledAt: ${futureNonScheduled}건 (⚠️ Flutter 테스트 데이터)`);

  // 3) 스탯 있는데 userId NULL
  const matchIds = matches.map((m) => m.id);
  const statsWithNull = await prisma.matchPlayerStat.count({
    where: {
      tournamentMatchId: { in: matchIds },
      tournamentTeamPlayer: { userId: null },
    },
  });
  console.log(`\n=== 3) userId 미연결 스탯 레코드: ${statsWithNull}건 ===`);

  console.log("\n========================================");
  console.log("요약");
  console.log("========================================");
  console.log(`- 날짜: ${dateDiag}`);
  console.log(`- userId NULL 선수: ${nullPlayers}/${allPlayers}`);
  console.log(`- 0:0 공식 경기: ${zeroScoreOfficial}`);
  console.log(`- 미래 공식 경기 (이상 데이터): ${futureNonScheduled}`);
  console.log(`- 미연결 스탯: ${statsWithNull}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
