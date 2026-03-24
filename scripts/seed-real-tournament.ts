/**
 * 2026년 3차 BDR 뉴비리그 실전 데이터 시드
 *
 * 기존 대회(e9dc3c5d)에 4팀 + 39명 선수 등록
 * - 앤드원 (13명), 에레메스 (8명), 치토스 (6명), 핫도그 (12명)
 *
 * 실행: npx tsx scripts/seed-real-tournament.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const TOURNAMENT_ID = "e9dc3c5d-874e-4877-a947-a49a1b58f0e6";

// 생년월일 파싱: YYMMDD, YY, YYMM, "YY MM DD" 등
function parseBirthDate(raw: string): Date | null {
  const cleaned = raw.replace(/\s+/g, "");
  if (!cleaned || cleaned.length < 2) return null;

  let year: number;
  let month = 1;
  let day = 1;

  if (cleaned.length === 6) {
    // YYMMDD
    year = parseInt(cleaned.slice(0, 2));
    month = parseInt(cleaned.slice(2, 4));
    day = parseInt(cleaned.slice(4, 6));
  } else if (cleaned.length === 4) {
    // YYMM
    year = parseInt(cleaned.slice(0, 2));
    month = parseInt(cleaned.slice(2, 4));
  } else if (cleaned.length === 2) {
    // YY only
    year = parseInt(cleaned);
  } else {
    return null;
  }

  // 2자리 연도 → 4자리: 00~29 → 2000~2029, 30~99 → 1930~1999
  year = year <= 29 ? 2000 + year : 1900 + year;

  return new Date(year, month - 1, day);
}

interface PlayerData {
  jersey: number;
  name: string;
  birthRaw: string;
  position: string;
}

const teamsData: {
  teamName: string;
  primaryColor: string;
  secondaryColor: string;
  players: PlayerData[];
}[] = [
  {
    teamName: "앤드원",
    primaryColor: "#1E3A5F",
    secondaryColor: "#FFFFFF",
    players: [
      { jersey: 10, name: "김민성", birthRaw: "020904", position: "G" },
      { jersey: 11, name: "이진우", birthRaw: "950106", position: "G" },
      { jersey: 12, name: "정재욱", birthRaw: "011224", position: "F" },
      { jersey: 13, name: "박인성", birthRaw: "001215", position: "G" },
      { jersey: 14, name: "이승준", birthRaw: "911011", position: "C" },
      { jersey: 24, name: "문종인", birthRaw: "940710", position: "F" },
      { jersey: 32, name: "안태성", birthRaw: "940522", position: "G" },
      { jersey: 45, name: "주요한", birthRaw: "980219", position: "C" },
      { jersey: 5, name: "김훈", birthRaw: "000327", position: "G" },
      { jersey: 51, name: "최종문", birthRaw: "001024", position: "F" },
      { jersey: 7, name: "선태영", birthRaw: "020716", position: "G" },
      { jersey: 8, name: "곽성현", birthRaw: "990805", position: "F" },
      { jersey: 9, name: "이명준", birthRaw: "990219", position: "F" },
    ],
  },
  {
    teamName: "에레메스",
    primaryColor: "#8B4513",
    secondaryColor: "#FFD700",
    players: [
      { jersey: 1, name: "이마리", birthRaw: "00", position: "G" },
      { jersey: 12, name: "계린다", birthRaw: "831105", position: "G" },
      { jersey: 2, name: "이상우", birthRaw: "00", position: "G" },
      { jersey: 3, name: "이호준", birthRaw: "01", position: "C" },
      { jersey: 30, name: "임상엽", birthRaw: "83", position: "F" },
      { jersey: 4, name: "구민서", birthRaw: "01", position: "G" },
      { jersey: 5, name: "장창훈", birthRaw: "85", position: "C" },
      { jersey: 6, name: "김지현", birthRaw: "00", position: "C" },
    ],
  },
  {
    teamName: "치토스",
    primaryColor: "#FF6B00",
    secondaryColor: "#FFFFFF",
    players: [
      { jersey: 0, name: "임형민", birthRaw: "970303", position: "G" },
      { jersey: 1, name: "박준형", birthRaw: "970407", position: "C" },
      { jersey: 13, name: "김시준", birthRaw: "910930", position: "C" },
      { jersey: 22, name: "최기창", birthRaw: "961126", position: "G" },
      { jersey: 30, name: "임형준", birthRaw: "951015", position: "G" },
      { jersey: 6, name: "윤지호", birthRaw: "980301", position: "PF" },
    ],
  },
  {
    teamName: "핫도그",
    primaryColor: "#CC0000",
    secondaryColor: "#FFCC00",
    players: [
      { jersey: 0, name: "박상완", birthRaw: "90 05 07", position: "G" },
      { jersey: 1, name: "김훈재", birthRaw: "82 11 04", position: "F" },
      { jersey: 11, name: "서동일", birthRaw: "83 03 24", position: "F" },
      { jersey: 19, name: "박성훈", birthRaw: "82 09 30", position: "G" },
      { jersey: 2, name: "김랜돌", birthRaw: "82 11 11", position: "G" },
      { jersey: 21, name: "신명우", birthRaw: "82 02 20", position: "F" },
      { jersey: 3, name: "김경수", birthRaw: "87 02 07", position: "F" },
      { jersey: 4, name: "이타미", birthRaw: "79 05 02", position: "C" },
      { jersey: 5, name: "김유진", birthRaw: "92 05 12", position: "G" },
      { jersey: 55, name: "박희철", birthRaw: "82 11 14", position: "F" },
      { jersey: 6, name: "남상현", birthRaw: "86 05 31", position: "F" },
      { jersey: 7, name: "김기억", birthRaw: "82 05 20", position: "F" },
    ],
  },
];

async function main() {
  console.log("🏀 뉴비리그 실전 데이터 시드 시작...\n");

  // 0. 대회 존재 확인
  const tournament = await prisma.tournament.findUnique({
    where: { id: TOURNAMENT_ID },
  });
  if (!tournament) {
    throw new Error(`대회를 찾을 수 없습니다: ${TOURNAMENT_ID}`);
  }
  console.log(`  ✅ 대회 확인: "${tournament.name}"`);

  // 0-1. 기존 대회팀 데이터 정리 (재실행 가능)
  const existingTT = await prisma.tournamentTeam.findMany({
    where: { tournamentId: TOURNAMENT_ID },
    select: { id: true },
  });
  if (existingTT.length > 0) {
    // 매치 관련 데이터 먼저 삭제 (FK 제약)
    const existingMatches = await prisma.tournamentMatch.findMany({
      where: { tournamentId: TOURNAMENT_ID },
      select: { id: true },
    });
    for (const m of existingMatches) {
      await prisma.matchPlayerStat.deleteMany({ where: { matchId: m.id } });
      await prisma.match_events.deleteMany({ where: { matchId: m.id } });
    }
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: TOURNAMENT_ID } });

    for (const tt of existingTT) {
      await prisma.tournamentTeamPlayer.deleteMany({ where: { tournamentTeamId: tt.id } });
    }
    await prisma.tournamentTeam.deleteMany({ where: { tournamentId: TOURNAMENT_ID } });
    console.log(`  ♻️  기존 대회팀 ${existingTT.length}개 삭제`);
  }

  const passwordHash = await bcrypt.hash("bdr2026!", 12);
  const organizerId = tournament.organizerId;
  const now = new Date();

  // API Token 생성 (없으면)
  if (!tournament.apiToken) {
    const apiToken = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
    await prisma.tournament.update({
      where: { id: TOURNAMENT_ID },
      data: { apiToken },
    });
    console.log(`  ✅ API Token 생성: ${apiToken}`);
  } else {
    console.log(`  ℹ️  API Token 기존: ${tournament.apiToken}`);
  }

  // 팀별 처리
  for (const teamData of teamsData) {
    console.log(`\n  ── ${teamData.teamName} (${teamData.players.length}명) ──`);

    // 1. Team 생성 (없으면)
    let team = await prisma.team.findFirst({ where: { name: teamData.teamName } });
    if (!team) {
      team = await prisma.team.create({
        data: {
          uuid: randomUUID(),
          name: teamData.teamName,
          description: `BDR 뉴비리그 참가팀 — ${teamData.teamName}`,
          status: "active",
          captainId: organizerId,
          manager_id: organizerId,
          primaryColor: teamData.primaryColor,
          secondaryColor: teamData.secondaryColor,
          members_count: teamData.players.length,
        },
      });
      console.log(`  ✅ 팀 생성: ${team.name} (id: ${team.id})`);
    } else {
      console.log(`  ℹ️  팀 재사용: ${team.name} (id: ${team.id})`);
    }

    // 2. TournamentTeam 등록
    const tt = await prisma.tournamentTeam.create({
      data: {
        tournamentId: TOURNAMENT_ID,
        teamId: team.id,
        status: "approved",
        approved_at: now,
        payment_status: "paid",
        seedNumber: teamsData.indexOf(teamData) + 1,
      },
    });
    console.log(`  ✅ 대회팀 등록 (tt_id: ${tt.id})`);

    // 3. 선수 계정 + TeamMember + TournamentTeamPlayer
    for (let i = 0; i < teamData.players.length; i++) {
      const p = teamData.players[i];
      const email = `${teamData.teamName.toLowerCase().replace(/\s/g, "")}_${p.jersey}@bdr.local`;
      const birthDate = parseBirthDate(p.birthRaw);

      // User upsert
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          nickname: `${teamData.teamName} #${p.jersey}`,
          name: p.name,
          position: p.position,
          birth_date: birthDate,
          status: "active",
        },
        create: {
          email,
          passwordDigest: passwordHash,
          name: p.name,
          nickname: `${teamData.teamName} #${p.jersey}`,
          position: p.position,
          birth_date: birthDate,
          status: "active",
          isAdmin: false,
        },
      });

      // TeamMember: 등번호 충돌 시 기존 멤버 비활성화 후 생성
      const existingByUser = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
      });
      if (existingByUser) {
        await prisma.teamMember.update({
          where: { id: existingByUser.id },
          data: { jerseyNumber: p.jersey, position: p.position, status: "active" },
        });
      } else {
        // 같은 팀에 같은 등번호가 있으면 기존 것을 비활성화
        const existingByJersey = await prisma.teamMember.findUnique({
          where: { teamId_jerseyNumber: { teamId: team.id, jerseyNumber: p.jersey } },
        });
        if (existingByJersey) {
          await prisma.teamMember.update({
            where: { id: existingByJersey.id },
            data: { jerseyNumber: null, status: "inactive" },
          });
        }
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: user.id,
            jerseyNumber: p.jersey,
            role: i === 0 ? "captain" : "member",
            position: p.position,
            status: "active",
            joined_at: now,
          },
        });
      }

      // TournamentTeamPlayer
      await prisma.tournamentTeamPlayer.create({
        data: {
          tournamentTeamId: tt.id,
          userId: user.id,
          jerseyNumber: p.jersey,
          position: p.position,
          role: i === 0 ? "captain" : "player",
          is_active: true,
          isStarter: i < 5,
        },
      });
    }
    console.log(`  ✅ 선수 ${teamData.players.length}명 등록 완료`);
  }

  // 대회 상태 → active + teams_count 업데이트
  const updatedTournament = await prisma.tournament.update({
    where: { id: TOURNAMENT_ID },
    data: {
      status: "active",
      teams_count: teamsData.length,
    },
    select: { apiToken: true, status: true },
  });

  // 기록원 배정 (organizer를 기록원으로도 등록)
  await prisma.tournament_recorders.upsert({
    where: {
      tournamentId_recorderId: {
        tournamentId: TOURNAMENT_ID,
        recorderId: organizerId,
      },
    },
    update: { isActive: true },
    create: {
      tournamentId: TOURNAMENT_ID,
      recorderId: organizerId,
      assignedBy: organizerId,
      isActive: true,
    },
  });

  // 요약
  console.log("\n" + "=".repeat(60));
  console.log("🎉 뉴비리그 데이터 시드 완료!");
  console.log("=".repeat(60));
  console.log(`\n🏆 대회: ${tournament.name}`);
  console.log(`  ID     : ${TOURNAMENT_ID}`);
  console.log(`  상태   : ${updatedTournament.status}`);
  console.log(`  API Token: ${updatedTournament.apiToken}`);
  console.log(`\n👥 팀별 선수 수:`);
  for (const t of teamsData) {
    console.log(`  ${t.teamName}: ${t.players.length}명`);
  }
  console.log(`  총 ${teamsData.reduce((s, t) => s + t.players.length, 0)}명`);
  console.log("\n📱 bdr_stat 앱에서 API Token으로 연결 가능");
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
