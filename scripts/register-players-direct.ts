import { PrismaClient } from "@prisma/client";

// Direct URL (RLS 우회)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.ykzpqpxydhbjpsiyqwfp:vudckdwlq1!@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
    },
  },
});

const TOURNAMENT_ID = "33d346d1-9f04-43c2-9d02-042ae0c0b1dd";

function normalizePos(s: string): string | null {
  if (!s || s === '-') return null;
  const u = s.toUpperCase().trim();
  if (u.startsWith('G') || u === '가드') return 'G';
  if (u.startsWith('F') || u === '포워드') return 'F';
  if (u.startsWith('C') || u === '센터') return 'C';
  return u;
}

function parseBirth(s: string): string | null {
  if (!s || s === '-' || s.length < 6) return null;
  const c = s.replace(/[^0-9]/g, '');
  if (c.length !== 6) return null;
  let yy = parseInt(c.substring(0, 2));
  const mm = c.substring(2, 4);
  const dd = c.substring(4, 6);
  const year = yy >= 50 ? 1900 + yy : 2000 + yy;
  return `${year}-${mm}-${dd}`;
}

interface P { jerseyNumber: number | null; name: string; birth: string; position: string; }
interface T { teamName: string; players: P[]; }

const allTeams: T[] = [
  { teamName: "근농사", players: [
    { jerseyNumber: null, name: "정현진", birth: "820507", position: "가드" },
    { jerseyNumber: null, name: "박하", birth: "090910", position: "가드" },
    { jerseyNumber: null, name: "심완섭", birth: "870720", position: "포워드" },
    { jerseyNumber: null, name: "김수근", birth: "941117", position: "가드" },
    { jerseyNumber: null, name: "정원순", birth: "860102", position: "포워드" },
    { jerseyNumber: 1, name: "김관욱", birth: "840921", position: "포워드" },
    { jerseyNumber: 4, name: "신재욱", birth: "871203", position: "가드" },
    { jerseyNumber: 5, name: "박진성", birth: "760118", position: "가드" },
    { jerseyNumber: 99, name: "최경원", birth: "871101", position: "포워드" },
  ]},
  { teamName: "라곰", players: [
    { jerseyNumber: null, name: "류희원", birth: "830512", position: "F" },
    { jerseyNumber: 0, name: "이현진", birth: "881017", position: "G" },
    { jerseyNumber: 1, name: "김현수", birth: "830122", position: "F" },
    { jerseyNumber: 11, name: "박용호", birth: "821026", position: "F" },
    { jerseyNumber: 15, name: "백규재", birth: "830629", position: "F" },
    { jerseyNumber: 17, name: "김상범", birth: "880709", position: "G" },
    { jerseyNumber: 23, name: "정광석", birth: "880105", position: "G" },
    { jerseyNumber: 3, name: "배민규", birth: "950122", position: "G" },
    { jerseyNumber: 34, name: "박진모", birth: "810304", position: "F" },
    { jerseyNumber: 7, name: "이준영", birth: "860325", position: "F" },
    { jerseyNumber: 91, name: "손혁준", birth: "800109", position: "G" },
  ]},
  { teamName: "레드핫", players: [
    { jerseyNumber: 30, name: "권보경", birth: "", position: "G" },
    { jerseyNumber: 14, name: "김민철", birth: "", position: "G" },
    { jerseyNumber: 45, name: "김범수", birth: "", position: "G" },
    { jerseyNumber: 38, name: "김승현", birth: "", position: "G" },
    { jerseyNumber: 32, name: "박준일", birth: "", position: "F" },
    { jerseyNumber: 20, name: "김훈", birth: "", position: "G" },
    { jerseyNumber: 22, name: "박정우", birth: "", position: "F" },
    { jerseyNumber: 34, name: "황순제", birth: "", position: "F" },
    { jerseyNumber: 1, name: "정승오", birth: "", position: "G" },
    { jerseyNumber: 77, name: "김태환", birth: "", position: "G" },
    { jerseyNumber: 0, name: "김석환", birth: "", position: "G" },
    { jerseyNumber: 4, name: "최준서", birth: "", position: "G" },
    { jerseyNumber: 19, name: "박준혁", birth: "", position: "F" },
  ]},
  { teamName: "리바운드 YB", players: [
    { jerseyNumber: 1, name: "박태훈", birth: "871116", position: "F" },
    { jerseyNumber: 10, name: "채강산", birth: "950816", position: "F" },
    { jerseyNumber: 11, name: "심경빈", birth: "010803", position: "F" },
    { jerseyNumber: 12, name: "황경태", birth: "811222", position: "G" },
    { jerseyNumber: 32, name: "장성재", birth: "070312", position: "F" },
    { jerseyNumber: 4, name: "김도형", birth: "981218", position: "G" },
    { jerseyNumber: 41, name: "전승재", birth: "980115", position: "G" },
    { jerseyNumber: 81, name: "고광우", birth: "080123", position: "F" },
  ]},
  { teamName: "팀제이에이치", players: [
    { jerseyNumber: 0, name: "김상언", birth: "880730", position: "F" },
    { jerseyNumber: 13, name: "이동재", birth: "980527", position: "G" },
    { jerseyNumber: 14, name: "김정현", birth: "960416", position: "C" },
    { jerseyNumber: 15, name: "황준상", birth: "950328", position: "F" },
    { jerseyNumber: 25, name: "한채웅", birth: "010720", position: "G" },
    { jerseyNumber: 41, name: "정민우", birth: "980503", position: "F" },
    { jerseyNumber: 5, name: "김진우", birth: "950310", position: "G" },
    { jerseyNumber: 7, name: "최준혁", birth: "971205", position: "G" },
    { jerseyNumber: 9, name: "이종호", birth: "980309", position: "G" },
  ]},
  { teamName: "혼", players: [
    { jerseyNumber: 0, name: "김산", birth: "961230", position: "G" },
    { jerseyNumber: 1, name: "김창범", birth: "830817", position: "F" },
    { jerseyNumber: 10, name: "배준혁", birth: "980527", position: "G" },
    { jerseyNumber: 12, name: "정우중", birth: "990212", position: "F" },
    { jerseyNumber: 14, name: "홍재현", birth: "981125", position: "G" },
    { jerseyNumber: 15, name: "이찬희", birth: "970905", position: "F" },
    { jerseyNumber: 2, name: "김웅기", birth: "900714", position: "G" },
    { jerseyNumber: 24, name: "김도여", birth: "000519", position: "G" },
    { jerseyNumber: 3, name: "박준수", birth: "971002", position: "G" },
    { jerseyNumber: 32, name: "최용훈", birth: "940609", position: "F" },
    { jerseyNumber: 35, name: "황규철", birth: "910204", position: "F" },
    { jerseyNumber: 5, name: "신윤호", birth: "941006", position: "F" },
    { jerseyNumber: 54, name: "이남희", birth: "990508", position: "G" },
    { jerseyNumber: 7, name: "김성훈", birth: "840105", position: "G" },
  ]},
];

async function main() {
  console.log(`\n🏀 선수 등록 (Direct DB)\n`);

  for (const team of allTeams) {
    const t = await prisma.$queryRaw<{id: bigint}[]>`SELECT id FROM teams WHERE name = ${team.teamName} LIMIT 1`;
    if (!t.length) { console.log(`❌ 팀 없음: ${team.teamName}`); continue; }
    const teamId = t[0].id;

    const tt = await prisma.$queryRaw<{id: bigint}[]>`
      SELECT id FROM tournament_teams WHERE tournament_id = ${TOURNAMENT_ID}::uuid AND team_id = ${teamId} LIMIT 1`;
    if (!tt.length) { console.log(`❌ 대회 미등록: ${team.teamName}`); continue; }
    const ttId = tt[0].id;

    console.log(`\n📋 ${team.teamName} (ttId=${ttId})`);

    for (const p of team.players) {
      const pos = normalizePos(p.position);
      const birth = parseBirth(p.birth);
      const email = `${team.teamName.replace(/\s/g, '')}_${p.jerseyNumber ?? p.name}@bdr.local`;
      const nick = `${team.teamName} #${p.jerseyNumber ?? '?'}`;

      try {
        // 유저 upsert
        let users = await prisma.$queryRaw<{id: bigint}[]>`SELECT id FROM users WHERE email = ${email} LIMIT 1`;

        if (!users.length) {
          if (birth) {
            await prisma.$executeRawUnsafe(
              `INSERT INTO users (email, name, nickname, password_digest, position, birth_date, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6::date, NOW(), NOW()) ON CONFLICT (email) DO NOTHING`,
              email, p.name, nick, 'bdr_temp_2026', pos, birth
            );
          } else {
            await prisma.$executeRawUnsafe(
              `INSERT INTO users (email, name, nickname, password_digest, position, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT (email) DO NOTHING`,
              email, p.name, nick, 'bdr_temp_2026', pos
            );
          }
          users = await prisma.$queryRaw<{id: bigint}[]>`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
        }

        if (!users.length) { console.log(`  ❌ ${p.name}`); continue; }
        const userId = users[0].id;

        // team_members
        await prisma.$executeRawUnsafe(
          `INSERT INTO team_members (team_id, user_id, role, jersey_number, position, status, joined_at, created_at, updated_at) VALUES ($1, $2, 'player', $3, $4, 'active', NOW(), NOW(), NOW()) ON CONFLICT (team_id, user_id) DO NOTHING`,
          teamId, userId, p.jerseyNumber, pos
        );

        // tournament_team_players
        await prisma.$executeRawUnsafe(
          `INSERT INTO tournament_team_players (tournament_team_id, user_id, jersey_number, position, role, is_starter, created_at, updated_at) VALUES ($1, $2, $3, $4, 'player', false, NOW(), NOW()) ON CONFLICT DO NOTHING`,
          ttId, userId, p.jerseyNumber, pos
        );

        console.log(`  ✅ #${p.jerseyNumber ?? '?'} ${p.name}`);
      } catch (e: any) {
        console.log(`  ⚠️ #${p.jerseyNumber ?? '?'} ${p.name}: ${e.meta?.message?.substring(0,60) ?? e.message?.substring(0,60)}`);
      }
    }
  }

  console.log(`\n🎉 완료!\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
