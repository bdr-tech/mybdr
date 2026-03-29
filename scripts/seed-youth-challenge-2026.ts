/**
 * BDR유스챌린지 시드
 *
 * 대회 생성 + 6팀 (조별) + 9경기 (예선6 + 결정전3)
 * 선수는 현장등록 → 팀/매치만 등록
 *
 * 실행: npx tsx scripts/seed-youth-challenge-2026.ts
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const teamsData = [
  // A조
  { teamName: "얼라이브A", group: "A", seed: 1, primary: "#E53935", secondary: "#FFFFFF" },
  { teamName: "스티즈A", group: "A", seed: 2, primary: "#1565C0", secondary: "#FFFFFF" },
  { teamName: "우아한스포츠", group: "A", seed: 3, primary: "#2E7D32", secondary: "#FFFFFF" },
  // B조
  { teamName: "디오스포츠", group: "B", seed: 1, primary: "#6A1B9A", secondary: "#FFFFFF" },
  { teamName: "얼라이브B", group: "B", seed: 2, primary: "#E53935", secondary: "#FFD700" },
  { teamName: "스티즈B", group: "B", seed: 3, primary: "#1565C0", secondary: "#FFD700" },
];

// 경기 일정 (3/29 KST)
const matchSchedule = [
  // 예선 6경기
  { no: 1, round: "예선", time: "16:00", group: "A", homeSeed: 1, awaySeed: 2 }, // 얼라이브A vs 스티즈A
  { no: 2, round: "예선", time: "16:35", group: "B", homeSeed: 1, awaySeed: 2 }, // 디오스포츠 vs 얼라이브B
  { no: 3, round: "예선", time: "17:10", group: "A", homeSeed: 2, awaySeed: 3 }, // 스티즈A vs 우아한스포츠
  { no: 4, round: "예선", time: "17:45", group: "B", homeSeed: 2, awaySeed: 3 }, // 얼라이브B vs 스티즈B
  { no: 5, round: "예선", time: "18:20", group: "A", homeSeed: 3, awaySeed: 1 }, // 우아한스포츠 vs 얼라이브A
  { no: 6, round: "예선", time: "18:55", group: "B", homeSeed: 3, awaySeed: 1 }, // 스티즈B vs 디오스포츠
  // 결정전 3경기 (팀 미정 → homeTeamId/awayTeamId = null)
  { no: 7, round: "5-6위 결정전", time: "19:30", group: null, homeSeed: null, awaySeed: null },
  { no: 8, round: "3-4위 결정전", time: "20:05", group: null, homeSeed: null, awaySeed: null },
  { no: 9, round: "결승전", time: "20:40", group: null, homeSeed: null, awaySeed: null },
];

async function main() {
  console.log("🏀 BDR유스챌린지 시드 시작...\n");

  // organizer 찾기
  const ref = await prisma.tournament.findFirst({
    where: { name: { contains: "BDR" } },
    select: { organizerId: true },
  });
  if (!ref) throw new Error("기존 BDR 대회를 찾을 수 없습니다");
  const organizerId = ref.organizerId;

  // 1. 대회 생성
  const apiToken = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const tournament = await prisma.tournament.create({
    data: {
      name: "BDR유스챌린지",
      description: "2026년 BDR 유스챌린지 (3/29)",
      organizerId,
      status: "in_progress",
      format: "group_stage",
      startDate: new Date("2026-03-29T00:00:00+09:00"),
      maxTeams: 8,
      min_teams: 4,
      team_size: 5,
      roster_min: 5,
      roster_max: 15,
      apiToken,
      teams_count: teamsData.length,
    },
  });
  console.log(`  ✅ 대회 생성: "${tournament.name}" (id: ${tournament.id})`);

  const TOURNAMENT_ID = tournament.id;
  const now = new Date();

  // 기록원 배정
  await prisma.tournament_recorders.create({
    data: {
      tournamentId: TOURNAMENT_ID,
      recorderId: organizerId,
      assignedBy: organizerId,
      isActive: true,
    },
  });

  // 2. 팀 + TournamentTeam 생성
  // ttMap: { "A-1": tt_id, "A-2": tt_id, ... }
  const ttMap: Record<string, bigint> = {};

  for (const td of teamsData) {
    let team = await prisma.team.findFirst({ where: { name: td.teamName } });
    if (!team) {
      team = await prisma.team.create({
        data: {
          uuid: randomUUID(),
          name: td.teamName,
          description: `BDR유스챌린지 참가팀 — ${td.teamName}`,
          status: "active",
          captainId: organizerId,
          manager_id: organizerId,
          primaryColor: td.primary,
          secondaryColor: td.secondary,
          members_count: 0,
        },
      });
      console.log(`  ✅ 팀 생성: ${team.name} (id: ${team.id})`);
    } else {
      console.log(`  ℹ️  팀 재사용: ${team.name} (id: ${team.id})`);
    }

    const tt = await prisma.tournamentTeam.create({
      data: {
        tournamentId: TOURNAMENT_ID,
        teamId: team.id,
        status: "approved",
        approved_at: now,
        payment_status: "paid",
        seedNumber: td.seed,
        groupName: td.group,
      },
    });
    ttMap[`${td.group}-${td.seed}`] = tt.id;
    console.log(`  ✅ 대회팀 등록: ${td.teamName} → ${td.group}조 ${td.seed}번 (tt_id: ${tt.id})`);
  }

  // 3. 매치 생성
  console.log("\n  ── 매치 등록 ──");
  for (const m of matchSchedule) {
    const [hour, min] = m.time.split(":").map(Number);
    const scheduledAt = new Date("2026-03-29T00:00:00+09:00");
    scheduledAt.setHours(hour, min, 0, 0);

    let homeTeamId: bigint | null = null;
    let awayTeamId: bigint | null = null;

    if (m.group && m.homeSeed && m.awaySeed) {
      homeTeamId = ttMap[`${m.group}-${m.homeSeed}`];
      awayTeamId = ttMap[`${m.group}-${m.awaySeed}`];
    }

    const match = await prisma.tournamentMatch.create({
      data: {
        tournamentId: TOURNAMENT_ID,
        homeTeamId,
        awayTeamId,
        roundName: m.round,
        round_number: m.round === "예선" ? 1 : 2,
        match_number: m.no,
        group_name: m.group,
        scheduledAt,
        status: "scheduled",
      },
    });
    const homeLabel = homeTeamId ? teamsData.find((t) => ttMap[`${t.group}-${t.seed}`] === homeTeamId)?.teamName : "TBD";
    const awayLabel = awayTeamId ? teamsData.find((t) => ttMap[`${t.group}-${t.seed}`] === awayTeamId)?.teamName : "TBD";
    console.log(`  ✅ #${m.no} ${m.time} ${m.round} — ${homeLabel} vs ${awayLabel} (id: ${match.id})`);
  }

  // 요약
  console.log("\n" + "=".repeat(60));
  console.log("🎉 BDR유스챌린지 시드 완료!");
  console.log("=".repeat(60));
  console.log(`\n🏆 대회: ${tournament.name}`);
  console.log(`  ID     : ${tournament.id}`);
  console.log(`  API Token: ${apiToken}`);
  console.log(`\n👥 팀: ${teamsData.length}개`);
  console.log(`  A조: 얼라이브A, 스티즈A, 우아한스포츠`);
  console.log(`  B조: 디오스포츠, 얼라이브B, 스티즈B`);
  console.log(`\n📅 매치: ${matchSchedule.length}경기`);
  console.log(`  예선 6경기 (16:00~18:55)`);
  console.log(`  결정전 3경기 (19:30~20:40) — 팀 미정(TBD)`);
  console.log("\n📱 bdr_stat 앱에서 API Token으로 연결 가능");
  console.log("   선수는 현장에서 등록");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ 에러:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
