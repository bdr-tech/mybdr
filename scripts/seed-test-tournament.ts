/**
 * 테스트 대회 시드 스크립트
 *
 * 생성 항목:
 * - 주최자 계정 (organizer@bdr.com / test1234!)
 * - 기록원 계정 (recorder@bdr.com / test1234!)  ← Flutter 앱 로그인용
 * - 2팀: BDR Dragons(홈), BDR Lions(어웨이)
 * - 각 팀 선수 7명 (스타터5 + 벤치2)
 * - 대회 1개 (in_progress)
 * - 경기 1개 (현재 시각 기준 scheduled)
 *
 * 실행: npx tsx scripts/seed-test-tournament.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🏀 테스트 대회 데이터 생성 시작...\n");

  // ─────────────────────────────────────────
  // 0. 기존 테스트 데이터 정리 (재실행 가능)
  // ─────────────────────────────────────────
  const oldTournament = await prisma.tournament.findFirst({
    where: { name: "BDR 테스트 대회 2026" },
  });
  if (oldTournament) {
    // 기록원 배정 먼저 삭제
    await prisma.tournament_recorders.deleteMany({
      where: { tournamentId: oldTournament.id },
    });
    // 경기 이벤트/선수스탯 삭제
    const matches = await prisma.tournamentMatch.findMany({
      where: { tournamentId: oldTournament.id },
      select: { id: true },
    });
    for (const m of matches) {
      await prisma.matchPlayerStat.deleteMany({ where: { matchId: m.id } });
    }
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: oldTournament.id } });
    // 팀 선수 삭제
    const teams = await prisma.tournamentTeam.findMany({
      where: { tournamentId: oldTournament.id },
      select: { id: true },
    });
    for (const t of teams) {
      await prisma.tournamentTeamPlayer.deleteMany({ where: { tournamentTeamId: t.id } });
    }
    await prisma.tournamentTeam.deleteMany({ where: { tournamentId: oldTournament.id } });
    await prisma.tournament.delete({ where: { id: oldTournament.id } });
    console.log("  ♻️  기존 테스트 대회 삭제 완료");
  }

  // ─────────────────────────────────────────
  // 1. 유저 생성 (주최자 + 기록원)
  // ─────────────────────────────────────────
  const passwordHash = await bcrypt.hash("test1234!", 12);

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@bdr.com" },
    update: { nickname: "대회주최자", status: "active" },
    create: {
      email: "organizer@bdr.com",
      passwordDigest: passwordHash,
      name: "대회 주최자",
      nickname: "대회주최자",
      status: "active",
      isAdmin: false,
    },
  });
  console.log(`  ✅ 주최자: ${organizer.email} (id: ${organizer.id})`);

  const recorder = await prisma.user.upsert({
    where: { email: "recorder@bdr.com" },
    update: { nickname: "기록원", status: "active" },
    create: {
      email: "recorder@bdr.com",
      passwordDigest: passwordHash,
      name: "기록원",
      nickname: "기록원",
      status: "active",
      isAdmin: false,
    },
  });
  console.log(`  ✅ 기록원: ${recorder.email} (id: ${recorder.id})`);

  // ─────────────────────────────────────────
  // 2. 선수 계정 생성 (팀당 7명)
  // ─────────────────────────────────────────
  const dragonsPlayerData = [
    { email: "dragons1@bdr.com", name: "김용호", nickname: "Dragons #5",  jersey: 5,  position: "PG" },
    { email: "dragons2@bdr.com", name: "이준혁", nickname: "Dragons #10", jersey: 10, position: "SG" },
    { email: "dragons3@bdr.com", name: "박민수", nickname: "Dragons #7",  jersey: 7,  position: "SF" },
    { email: "dragons4@bdr.com", name: "최태양", nickname: "Dragons #23", jersey: 23, position: "PF" },
    { email: "dragons5@bdr.com", name: "정성훈", nickname: "Dragons #42", jersey: 42, position: "C"  },
    { email: "dragons6@bdr.com", name: "한지훈", nickname: "Dragons #11", jersey: 11, position: "SG" },
    { email: "dragons7@bdr.com", name: "윤재원", nickname: "Dragons #33", jersey: 33, position: "PF" },
  ];

  const lionsPlayerData = [
    { email: "lions1@bdr.com", name: "강동원", nickname: "Lions #3",   jersey: 3,  position: "PG" },
    { email: "lions2@bdr.com", name: "서민준", nickname: "Lions #14",  jersey: 14, position: "SG" },
    { email: "lions3@bdr.com", name: "오세훈", nickname: "Lions #21",  jersey: 21, position: "SF" },
    { email: "lions4@bdr.com", name: "임찬호", nickname: "Lions #15",  jersey: 15, position: "PF" },
    { email: "lions5@bdr.com", name: "노재원", nickname: "Lions #44",  jersey: 44, position: "C"  },
    { email: "lions6@bdr.com", name: "배성민", nickname: "Lions #8",   jersey: 8,  position: "PG" },
    { email: "lions7@bdr.com", name: "권현우", nickname: "Lions #25",  jersey: 25, position: "SF" },
  ];

  const playerIds: Record<string, bigint> = {};
  for (const p of [...dragonsPlayerData, ...lionsPlayerData]) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { nickname: p.nickname, status: "active" },
      create: {
        email: p.email,
        passwordDigest: passwordHash,
        name: p.name,
        nickname: p.nickname,
        position: p.position,
        status: "active",
        isAdmin: false,
      },
    });
    playerIds[p.email] = user.id;
  }
  console.log(`  ✅ 선수 14명 upsert 완료`);

  // ─────────────────────────────────────────
  // 3. 팀 생성 (없으면 생성, 있으면 재사용)
  // ─────────────────────────────────────────
  const dragonsTeam =
    (await prisma.team.findFirst({ where: { name: "BDR Dragons" } })) ??
    (await prisma.team.create({
      data: {
        uuid: randomUUID(),
        name: "BDR Dragons",
        description: "BDR 테스트 팀 — Dragons",
        status: "active",
        captainId: organizer.id,
        manager_id: organizer.id,
      },
    }));

  const lionsTeam =
    (await prisma.team.findFirst({ where: { name: "BDR Lions" } })) ??
    (await prisma.team.create({
      data: {
        uuid: randomUUID(),
        name: "BDR Lions",
        description: "BDR 테스트 팀 — Lions",
        status: "active",
        captainId: organizer.id,
        manager_id: organizer.id,
      },
    }));

  console.log(`  ✅ 팀: ${dragonsTeam.name} (id: ${dragonsTeam.id}), ${lionsTeam.name} (id: ${lionsTeam.id})`);

  // ─────────────────────────────────────────
  // 4. 대회 생성
  // ─────────────────────────────────────────
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const tournament = await prisma.tournament.create({
    data: {
      name: "BDR 테스트 대회 2026",
      description: "Flutter 앱 연동 테스트용 대회",
      status: "in_progress",
      format: "single_elimination",
      startDate: today,
      endDate: todayEnd,
      organizerId: organizer.id,
      maxTeams: 2,
      min_teams: 2,
      team_size: 5,
      roster_min: 5,
      roster_max: 7,
      venue_name: "BDR 실내 코트",
      city: "서울",
      is_public: true,
      apiToken: randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, ""),
    },
  });

  console.log(`  ✅ 대회 생성: "${tournament.name}"`);

  // ─────────────────────────────────────────
  // 5. 대회팀 등록 (TournamentTeam)
  // ─────────────────────────────────────────
  const tt_dragons = await prisma.tournamentTeam.create({
    data: {
      tournamentId: tournament.id,
      teamId: dragonsTeam.id,
      status: "approved",
      approved_at: now,
      payment_status: "paid",
      seedNumber: 1,
    },
  });

  const tt_lions = await prisma.tournamentTeam.create({
    data: {
      tournamentId: tournament.id,
      teamId: lionsTeam.id,
      status: "approved",
      approved_at: now,
      payment_status: "paid",
      seedNumber: 2,
    },
  });

  console.log(`  ✅ 대회팀 등록: Dragons(tt_id: ${tt_dragons.id}), Lions(tt_id: ${tt_lions.id})`);

  // ─────────────────────────────────────────
  // 6. 선수 등록 (TournamentTeamPlayer)
  // ─────────────────────────────────────────
  for (let i = 0; i < dragonsPlayerData.length; i++) {
    const p = dragonsPlayerData[i];
    await prisma.tournamentTeamPlayer.create({
      data: {
        tournamentTeamId: tt_dragons.id,
        userId: playerIds[p.email],
        jerseyNumber: p.jersey,
        position: p.position,
        role: i === 0 ? "captain" : "player",
        is_active: true,
        isStarter: i < 5,
      },
    });
  }

  for (let i = 0; i < lionsPlayerData.length; i++) {
    const p = lionsPlayerData[i];
    await prisma.tournamentTeamPlayer.create({
      data: {
        tournamentTeamId: tt_lions.id,
        userId: playerIds[p.email],
        jerseyNumber: p.jersey,
        position: p.position,
        role: i === 0 ? "captain" : "player",
        is_active: true,
        isStarter: i < 5,
      },
    });
  }

  console.log(`  ✅ 선수 등록 완료 (Dragons 7명, Lions 7명)`);

  // ─────────────────────────────────────────
  // 7. 경기 생성
  // ─────────────────────────────────────────
  const matchTime = new Date(now);
  matchTime.setMinutes(matchTime.getMinutes() + 5);

  const match = await prisma.tournamentMatch.create({
    data: {
      tournamentId: tournament.id,
      homeTeamId: tt_dragons.id,
      awayTeamId: tt_lions.id,
      roundName: "결승",
      round_number: 1,
      match_number: 1,
      status: "scheduled",
      scheduledAt: matchTime,
      venue_name: "BDR 실내 코트 A",
      court_number: "A",
      quarterScores: {
        home: { q1: 0, q2: 0, q3: 0, q4: 0, ot: [] },
        away: { q1: 0, q2: 0, q3: 0, q4: 0, ot: [] },
      },
    },
  });

  console.log(`  ✅ 경기 생성: ${match.uuid} (id: ${match.id})`);

  // ─────────────────────────────────────────
  // 8. 기록원 배정
  // ─────────────────────────────────────────
  await prisma.tournament_recorders.upsert({
    where: {
      tournamentId_recorderId: {
        tournamentId: tournament.id,
        recorderId: recorder.id,
      },
    },
    update: { isActive: true },
    create: {
      tournamentId: tournament.id,
      recorderId: recorder.id,
      assignedBy: organizer.id,
      isActive: true,
    },
  });

  console.log(`  ✅ 기록원 배정 완료`);

  // ─────────────────────────────────────────
  // 완료 요약
  // ─────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("🎉 테스트 데이터 생성 완료!");
  console.log("=".repeat(60));
  console.log("\n📱 Flutter 앱 연결 정보");
  console.log(`  서버 URL : http://localhost:3000`);
  console.log(`\n🔑 로그인 (Flutter 앱)`);
  console.log(`  기록원   : recorder@bdr.com`);
  console.log(`  비밀번호 : test1234!`);
  console.log(`\n🏆 대회`);
  console.log(`  이름     : BDR 테스트 대회 2026`);
  console.log(`  API Token: ${tournament.apiToken}`);
  console.log(`  상태     : in_progress`);
  console.log(`\n🆚 경기`);
  console.log(`  홈팀     : BDR Dragons (tt_id: ${tt_dragons.id})`);
  console.log(`  어웨이   : BDR Lions (tt_id: ${tt_lions.id})`);
  console.log(`  경기 ID  : ${match.id}`);
  console.log(`  UUID     : ${match.uuid}`);
  console.log(`  예정시각 : ${matchTime.toLocaleString("ko-KR")}`);
  console.log(`\n👥 Dragons 선수 (등번호)`);
  dragonsPlayerData.forEach(p => console.log(`  #${String(p.jersey).padStart(2)} ${p.name} (${p.position})`));
  console.log(`\n👥 Lions 선수 (등번호)`);
  lionsPlayerData.forEach(p => console.log(`  #${String(p.jersey).padStart(2)} ${p.name} (${p.position})`));
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
