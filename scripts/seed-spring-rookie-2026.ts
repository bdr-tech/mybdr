/**
 * 2026년 1차 BDR 춘계 새내기 농구대회 시드
 *
 * 새 대회 생성 + 8팀 + 93명 선수 등록
 * - 가천대 주트 (8명), 명지대 파인 (10명), 서강 농구반 (10명), 아틀라스 (12명)
 * - SSBC (8명), KABA (12명), 칸스 (12명), 화구회 (13명)
 *
 * 실행: npx tsx scripts/seed-spring-rookie-2026.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// 생년월일 파싱: YYMMDD
function parseBirthDate(raw: string): Date | null {
  const cleaned = raw.replace(/\s+/g, "");
  if (!cleaned || cleaned.length < 2) return null;

  let year: number;
  let month = 1;
  let day = 1;

  if (cleaned.length === 6) {
    year = parseInt(cleaned.slice(0, 2));
    month = parseInt(cleaned.slice(2, 4));
    day = parseInt(cleaned.slice(4, 6));
  } else if (cleaned.length === 4) {
    year = parseInt(cleaned.slice(0, 2));
    month = parseInt(cleaned.slice(2, 4));
  } else if (cleaned.length === 2) {
    year = parseInt(cleaned);
  } else {
    return null;
  }

  year = year <= 29 ? 2000 + year : 1900 + year;
  return new Date(year, month - 1, day);
}

interface PlayerData {
  jersey: number | null;
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
    teamName: "가천대 주트",
    primaryColor: "#003B7B",
    secondaryColor: "#FFFFFF",
    players: [
      { jersey: 10, name: "박남혁", birthRaw: "060815", position: "G" },
      { jersey: 14, name: "김하경", birthRaw: "060518", position: "C" },
      { jersey: 17, name: "이근형", birthRaw: "050517", position: "F" },
      { jersey: 25, name: "박민우", birthRaw: "070705", position: "G" },
      { jersey: 32, name: "차우진", birthRaw: "040502", position: "G" },
      { jersey: 34, name: "정찬빈", birthRaw: "070521", position: "F" },
      { jersey: 5, name: "신동인", birthRaw: "071006", position: "F" },
      { jersey: 6, name: "김병서", birthRaw: "060307", position: "F" },
    ],
  },
  {
    teamName: "명지대 파인",
    primaryColor: "#1B3C73",
    secondaryColor: "#FFD700",
    players: [
      { jersey: 0, name: "박세준", birthRaw: "060922", position: "G" },
      { jersey: 12, name: "안지민", birthRaw: "060811", position: "F" },
      { jersey: 19, name: "서형준", birthRaw: "070615", position: "F" },
      { jersey: 22, name: "이준안", birthRaw: "061221", position: "G" },
      { jersey: 24, name: "황보재원", birthRaw: "061004", position: "G" },
      { jersey: 4, name: "이정연", birthRaw: "040106", position: "G" },
      { jersey: 45, name: "김상진", birthRaw: "071015", position: "F" },
      { jersey: 7, name: "엄민규", birthRaw: "060313", position: "G" },
      { jersey: 77, name: "안민용", birthRaw: "071211", position: "G" },
      { jersey: 88, name: "김한울", birthRaw: "071008", position: "F" },
    ],
  },
  {
    teamName: "서강 농구반",
    primaryColor: "#8B0000",
    secondaryColor: "#FFFFFF",
    players: [
      { jersey: 1, name: "진유현", birthRaw: "070907", position: "G" },
      { jersey: 11, name: "백정호", birthRaw: "070405", position: "SF" },
      { jersey: 19, name: "박준서", birthRaw: "061231", position: "SF" },
      { jersey: 2, name: "아나르", birthRaw: "070822", position: "SF" },
      { jersey: 25, name: "최우진", birthRaw: "070409", position: "PG" },
      { jersey: 3, name: "한재원", birthRaw: "060313", position: "G" },
      { jersey: 39, name: "김건", birthRaw: "060908", position: "C" },
      { jersey: 4, name: "이준우", birthRaw: "070527", position: "G" },
      { jersey: 49, name: "박형찬", birthRaw: "061101", position: "G" },
      { jersey: 5, name: "최지원", birthRaw: "070507", position: "PF" },
    ],
  },
  {
    teamName: "아틀라스",
    primaryColor: "#2C3E50",
    secondaryColor: "#E74C3C",
    players: [
      { jersey: 0, name: "문현태", birthRaw: "070210", position: "G" },
      { jersey: 13, name: "김필범", birthRaw: "070427", position: "C" },
      { jersey: 29, name: "배환", birthRaw: "060225", position: "G" },
      { jersey: 3, name: "여장혁", birthRaw: "070918", position: "F" },
      { jersey: 32, name: "신상연", birthRaw: "050103", position: "G" },
      { jersey: 40, name: "이승주", birthRaw: "051224", position: "G" },
      { jersey: 41, name: "진성원", birthRaw: "060317", position: "F" },
      { jersey: 42, name: "신재원", birthRaw: "070722", position: "F" },
      { jersey: 60, name: "김기문", birthRaw: "070109", position: "G" },
      { jersey: 81, name: "장민석", birthRaw: "060520", position: "G" },
      { jersey: 87, name: "김민석", birthRaw: "030529", position: "F" },
      { jersey: 9, name: "노현승", birthRaw: "070210", position: "F" },
    ],
  },
  {
    teamName: "SSBC",
    primaryColor: "#FF8C00",
    secondaryColor: "#000000",
    players: [
      { jersey: null, name: "최민준", birthRaw: "070606", position: "F" },
      { jersey: null, name: "노석현", birthRaw: "060409", position: "F" },
      { jersey: null, name: "소예준", birthRaw: "070303", position: "G" },
      { jersey: null, name: "임채윤", birthRaw: "070404", position: "F" },
      { jersey: null, name: "김서찬", birthRaw: "060724", position: "G" },
      { jersey: 15, name: "엄우진", birthRaw: "050718", position: "G" },
      { jersey: 35, name: "이우석", birthRaw: "051107", position: "G" },
      { jersey: 74, name: "임병률", birthRaw: "050124", position: "G" },
    ],
  },
  {
    teamName: "KABA",
    primaryColor: "#4A90D9",
    secondaryColor: "#FFFFFF",
    players: [
      { jersey: 10, name: "서웅재", birthRaw: "070606", position: "PG" },
      { jersey: 15, name: "이민건", birthRaw: "060626", position: "PF" },
      { jersey: 17, name: "이서진", birthRaw: "050323", position: "PG" },
      { jersey: 21, name: "전주호", birthRaw: "070329", position: "PG" },
      { jersey: 23, name: "한태영", birthRaw: "071209", position: "C" },
      { jersey: 28, name: "심영채", birthRaw: "050418", position: "C" },
      { jersey: 3, name: "고광현", birthRaw: "070514", position: "SG" },
      { jersey: 30, name: "Hou zeyiyang", birthRaw: "031125", position: "SF" },
      { jersey: 35, name: "장석호", birthRaw: "060219", position: "SG" },
      { jersey: 4, name: "김은재", birthRaw: "061103", position: "SG" },
      { jersey: 7, name: "박준기", birthRaw: "060925", position: "SG" },
      { jersey: 77, name: "심우현", birthRaw: "060223", position: "SG" },
    ],
  },
  {
    teamName: "칸스",
    primaryColor: "#333333",
    secondaryColor: "#FFD700",
    players: [
      { jersey: 1, name: "하주호", birthRaw: "070623", position: "F" },
      { jersey: 19, name: "박수혁", birthRaw: "060310", position: "F" },
      { jersey: 2, name: "김승우", birthRaw: "070527", position: "G" },
      { jersey: 3, name: "박인서", birthRaw: "070506", position: "G" },
      { jersey: 32, name: "이승민", birthRaw: "060330", position: "G" },
      { jersey: 4, name: "정현욱", birthRaw: "050912", position: "G" },
      { jersey: 42, name: "김정호", birthRaw: "961128", position: "G" },
      { jersey: 5, name: "전무곤", birthRaw: "060104", position: "F" },
      { jersey: 6, name: "염건일", birthRaw: "040823", position: "F" },
      { jersey: 7, name: "송시재", birthRaw: "070127", position: "F" },
      { jersey: 8, name: "조아준", birthRaw: "070312", position: "F" },
      { jersey: 9, name: "박건우", birthRaw: "060112", position: "F" },
    ],
  },
  {
    teamName: "화구회",
    primaryColor: "#DC143C",
    secondaryColor: "#FFFFFF",
    players: [
      { jersey: 0, name: "트레져", birthRaw: "050802", position: "G" },
      { jersey: 1, name: "오대성", birthRaw: "060529", position: "G" },
      { jersey: 10, name: "류영우", birthRaw: "050108", position: "G" },
      { jersey: 19, name: "손민준", birthRaw: "060927", position: "C" },
      { jersey: 2, name: "성원경", birthRaw: "070523", position: "G" },
      { jersey: 24, name: "강현준", birthRaw: "060818", position: "F" },
      { jersey: 3, name: "김도형", birthRaw: "060312", position: "F" },
      { jersey: 35, name: "백준렬", birthRaw: "050331", position: "F" },
      { jersey: 42, name: "임선우", birthRaw: "060220", position: "G" },
      { jersey: 43, name: "우메이 치데라 데파엘", birthRaw: "090422", position: "C" },
      { jersey: 8, name: "김동현", birthRaw: "050328", position: "C" },
      { jersey: 9, name: "송현근", birthRaw: "060314", position: "C" },
      { jersey: 91, name: "최성", birthRaw: "050901", position: "F" },
    ],
  },
];

async function main() {
  console.log("🏀 2026년 1차 BDR 춘계 새내기 농구대회 시드 시작...\n");

  // 0. organizer 찾기 (기존 대회 주최자 재사용)
  const refTournament = await prisma.tournament.findFirst({
    where: { name: { contains: "BDR" } },
    select: { organizerId: true },
  });
  if (!refTournament) throw new Error("기존 BDR 대회를 찾을 수 없습니다");
  const organizerId = refTournament.organizerId;

  // 1. 대회 생성
  const apiToken = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const tournament = await prisma.tournament.create({
    data: {
      name: "2026년 1차 BDR 춘계 새내기 농구대회",
      description: "2026년 BDR 춘계 새내기 농구대회 1차",
      organizerId,
      status: "in_progress",
      format: "group_stage",
      startDate: new Date("2026-03-29T00:00:00+09:00"),
      maxTeams: 16,
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
  const passwordHash = await bcrypt.hash("bdr2026!", 12);
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

  let totalPlayers = 0;

  // 팀별 처리
  for (let teamIdx = 0; teamIdx < teamsData.length; teamIdx++) {
    const teamData = teamsData[teamIdx];
    console.log(`\n  ── ${teamData.teamName} (${teamData.players.length}명) ──`);

    // 1. Team 생성 (없으면)
    let team = await prisma.team.findFirst({ where: { name: teamData.teamName } });
    if (!team) {
      team = await prisma.team.create({
        data: {
          uuid: randomUUID(),
          name: teamData.teamName,
          description: `BDR 춘계 새내기 대회 참가팀 — ${teamData.teamName}`,
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
        seedNumber: teamIdx + 1,
      },
    });
    console.log(`  ✅ 대회팀 등록 (tt_id: ${tt.id})`);

    // 3. 선수 계정 + TeamMember + TournamentTeamPlayer
    // SSBC처럼 등번호 없는 선수는 자동 배정
    let autoJersey = 99;
    for (let i = 0; i < teamData.players.length; i++) {
      const p = teamData.players[i];

      // 등번호 없는 선수 자동 배정
      let jersey = p.jersey;
      if (jersey === null) {
        jersey = autoJersey;
        autoJersey--;
      }

      // 이름 기반 이메일 (팀명 + 등번호)
      const teamSlug = teamData.teamName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9가-힣]/g, "");
      const email = `${teamSlug}_${jersey}@bdr.local`;
      const birthDate = parseBirthDate(p.birthRaw);

      // User upsert
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          nickname: `${teamData.teamName} #${jersey}`,
          name: p.name,
          position: p.position,
          birth_date: birthDate,
          status: "active",
        },
        create: {
          email,
          passwordDigest: passwordHash,
          name: p.name,
          nickname: `${teamData.teamName} #${jersey}`,
          position: p.position,
          birth_date: birthDate,
          status: "active",
          isAdmin: false,
        },
      });

      // TeamMember
      const existingByUser = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
      });
      if (existingByUser) {
        await prisma.teamMember.update({
          where: { id: existingByUser.id },
          data: { jerseyNumber: jersey, position: p.position, status: "active" },
        });
      } else {
        const existingByJersey = await prisma.teamMember.findUnique({
          where: { teamId_jerseyNumber: { teamId: team.id, jerseyNumber: jersey } },
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
            jerseyNumber: jersey,
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
          jerseyNumber: jersey,
          position: p.position,
          role: i === 0 ? "captain" : "player",
          is_active: true,
          isStarter: i < 5,
        },
      });
    }
    totalPlayers += teamData.players.length;
    console.log(`  ✅ 선수 ${teamData.players.length}명 등록 완료`);
  }

  // 요약
  console.log("\n" + "=".repeat(60));
  console.log("🎉 2026년 1차 BDR 춘계 새내기 농구대회 시드 완료!");
  console.log("=".repeat(60));
  console.log(`\n🏆 대회: ${tournament.name}`);
  console.log(`  ID     : ${tournament.id}`);
  console.log(`  상태   : in_progress`);
  console.log(`  API Token: ${apiToken}`);
  console.log(`\n👥 팀별 선수 수:`);
  for (const t of teamsData) {
    console.log(`  ${t.teamName}: ${t.players.length}명`);
  }
  console.log(`  총 ${totalPlayers}명`);
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
