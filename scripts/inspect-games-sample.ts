/**
 * [임시] cafe_posts ↔ games 매핑 진단 (raw SQL 기반)
 * 사용법: npx tsx scripts/inspect-games-sample.ts
 * 완료 후 삭제 예정
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ===== 1) cafe_posts =====
  console.log("=".repeat(60));
  console.log("cafe_posts (다음카페 원본)");
  console.log("=".repeat(60));

  const cafeStats = await prisma.$queryRaw<any[]>`
    SELECT
      COUNT(*)::int as total,
      COUNT(CASE WHEN game_datetime IS NULL THEN 1 END)::int as null_dt,
      COUNT(CASE WHEN location IS NULL THEN 1 END)::int as null_loc,
      COUNT(CASE WHEN cost IS NULL THEN 1 END)::int as null_cost,
      COUNT(CASE WHEN author IS NULL THEN 1 END)::int as null_author,
      COUNT(CASE WHEN author LIKE '%&#%' THEN 1 END)::int as entity_count,
      MAX(crawled_at) as latest_crawl
    FROM cafe_posts
  `;
  console.log(JSON.stringify(cafeStats[0], null, 2));

  if (cafeStats[0].total > 0) {
    const cafeSamples = await prisma.cafe_posts.findMany({
      orderBy: { crawled_at: "desc" },
      take: 3,
    });
    for (const [i, c] of cafeSamples.entries()) {
      console.log(`\n[cafe ${i + 1}] ${c.title}`);
      console.log(`  author=${c.author} home_team=${c.home_team}`);
      console.log(`  game_datetime=${c.game_datetime}`);
      console.log(`  location=${c.location}`);
      console.log(`  cost=${c.cost} guest_count=${c.guest_count}`);
      console.log(`  url=${c.original_url}`);
    }
  }

  // ===== 2) games =====
  console.log("\n" + "=".repeat(60));
  console.log("games (페이지 노출 테이블)");
  console.log("=".repeat(60));

  const gameStats = await prisma.$queryRaw<any[]>`
    SELECT
      COUNT(*)::int as total,
      COUNT(CASE WHEN venue_name IS NULL THEN 1 END)::int as null_venue,
      COUNT(CASE WHEN city IS NULL THEN 1 END)::int as null_city,
      COUNT(CASE WHEN COALESCE(fee_per_person, 0) = 0 THEN 1 END)::int as zero_fee,
      COUNT(CASE WHEN author_nickname IS NULL THEN 1 END)::int as null_author,
      COUNT(CASE WHEN author_nickname LIKE '%&#%' THEN 1 END)::int as entity_author,
      COUNT(CASE WHEN scheduled_at < NOW() THEN 1 END)::int as past_count,
      COUNT(CASE WHEN scheduled_at >= NOW() THEN 1 END)::int as future_count,
      MIN(scheduled_at) as earliest, MAX(scheduled_at) as latest,
      COUNT(CASE WHEN organizer_id IS NOT NULL THEN 1 END)::int as has_organizer,
      COUNT(DISTINCT organizer_id)::int as distinct_organizers
    FROM games
  `;
  console.log(JSON.stringify(gameStats[0], null, 2));

  // organizer 분포
  const organizers = await prisma.$queryRaw<any[]>`
    SELECT g.organizer_id, COUNT(*)::int as cnt, u.nickname, u.email
    FROM games g
    LEFT JOIN users u ON u.id = g.organizer_id
    GROUP BY g.organizer_id, u.nickname, u.email
    ORDER BY cnt DESC
    LIMIT 5
  `;
  console.log("\n--- 상위 5 organizer (누가 게임을 채우고 있나) ---");
  for (const o of organizers) {
    console.log(`  organizer_id=${o.organizer_id} cnt=${o.cnt} nickname=${o.nickname} email=${o.email}`);
  }

  // 표본
  const gameSamples = await prisma.games.findMany({
    orderBy: { created_at: "desc" },
    take: 3,
    select: {
      id: true, title: true, description: true, author_nickname: true,
      scheduled_at: true, venue_name: true, city: true, fee_per_person: true,
      max_participants: true, current_participants: true, game_type: true,
      status: true, metadata: true, organizer_id: true, created_at: true,
    },
  });
  for (const [i, g] of gameSamples.entries()) {
    console.log(`\n[game ${i + 1}] id=${g.id} organizer_id=${g.organizer_id}`);
    console.log(`  제목: ${g.title}`);
    console.log(`  author_nickname: ${g.author_nickname ?? "(NULL)"}`);
    console.log(`  scheduled_at: ${g.scheduled_at}`);
    console.log(`  venue/city: ${g.venue_name ?? "(NULL)"} / ${g.city ?? "(NULL)"}`);
    console.log(`  fee/인원: ${g.fee_per_person ?? "(NULL)"} / ${g.current_participants}/${g.max_participants}`);
    console.log(`  type/status: ${g.game_type}/${g.status}`);
    console.log(`  metadata: ${JSON.stringify(g.metadata)?.slice(0, 300) ?? "(NULL)"}`);
    console.log(`  description (300자): ${(g.description ?? "(NULL)").slice(0, 300).replace(/\n/g, " | ")}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
