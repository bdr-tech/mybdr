/**
 * games 테이블의 카페 메타 저장 위치 조사 (읽기 전용, 일회성).
 *
 * 목적:
 *   Phase 2b upsert 설계 직전 확인. prisma/schema.prisma 의 주석은
 *   "images 에 cafe_source_id/cafe_author/cafe_comments" 저장한다고 하지만
 *   src/app/(web)/games/[id]/page.tsx 는 metadata.cafe_comments 로 접근 중.
 *   → 실제 개발 DB 어디에 저장되어 있는지 확인 후 upsert 키 전략 확정.
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/inspect-games-cafe-meta.ts
 *
 * 동작: SELECT 만. 쓰기 0. --execute 플래그 없음.
 *   조사 끝나면 Phase 2b upsert 머지 후 삭제.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEV_DB_HOST = "bwoorsgoijvlgutkrcvs"; // 운영 DB 차단 가드 (다른 스크립트와 동일 관습)

async function main() {
  // 1. 운영 DB 차단 — 읽기 전용이지만 관습 일관성 유지
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.includes(DEV_DB_HOST)) {
    console.error("🚨 개발 DB가 아님. 중단.");
    console.error(`허용 호스트 식별자: ${DEV_DB_HOST}`);
    process.exit(1);
  }

  // 2. 전체 games 건수 (scratchpad의 "112건" 실측 검증)
  const total = await prisma.games.count();
  console.log(`총 games: ${total}건\n`);

  // 3. cafe_* 키 보유 건수 (games.metadata 만 — images 컬럼은 games 에 없음,
  //    스키마 주석은 다른 테이블 것으로 확인됨)
  const metaHits = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
    `SELECT COUNT(*)::bigint c FROM games
     WHERE metadata ?| array['cafe_source_id','cafe_dataid','cafe_author','cafe_comments','cafe_board','source_url']`
  );
  console.log(`cafe_* 키 보유 games: ${metaHits[0].c}건\n`);

  // 4. 샘플 3건 — metadata JSON 원본 확인
  const samples = await prisma.$queryRawUnsafe<
    Array<{
      id: bigint;
      title: string | null;
      game_type: number;
      metadata: unknown;
      created_at: Date;
    }>
  >(
    `SELECT id, title, game_type, metadata, created_at
     FROM games
     WHERE metadata::text LIKE '%cafe_%'
     ORDER BY created_at DESC
     LIMIT 3`
  );
  console.log(`=== 샘플 ${samples.length}건 (최근 생성순, metadata 전체) ===`);
  for (const s of samples) {
    console.log(`\n[id=${s.id}] "${s.title}" (game_type=${s.game_type})`);
    console.log(`  created_at: ${s.created_at.toISOString()}`);
    console.log(`  metadata  :`, JSON.stringify(s.metadata));
  }

  // 5. metadata 에 등장하는 cafe_* 키별 건수 (분포 파악)
  const metaKeys = await prisma.$queryRawUnsafe<Array<{ key: string; cnt: bigint }>>(
    `SELECT key, COUNT(*)::bigint cnt
     FROM games, jsonb_object_keys(metadata) key
     WHERE jsonb_typeof(metadata) = 'object' AND key LIKE 'cafe_%'
     GROUP BY key ORDER BY cnt DESC`
  );
  console.log(`\n=== metadata 의 cafe_* 키 분포 ===`);
  if (metaKeys.length === 0) console.log(`  (없음)`);
  for (const k of metaKeys) console.log(`  ${k.key}: ${k.cnt}`);

  // 6. metadata 전체 키 상위 20개 (cafe 외 다른 키도 보기)
  const allKeys = await prisma.$queryRawUnsafe<Array<{ key: string; cnt: bigint }>>(
    `SELECT key, COUNT(*)::bigint cnt
     FROM games, jsonb_object_keys(metadata) key
     WHERE jsonb_typeof(metadata) = 'object'
     GROUP BY key ORDER BY cnt DESC LIMIT 20`
  );
  console.log(`\n=== metadata 전체 키 상위 20 ===`);
  for (const k of allKeys) console.log(`  ${k.key}: ${k.cnt}`);

  // 7. cafe_posts 테이블 현황 (Phase 2b 직전 기준점)
  const cafePostsCount = await prisma.cafe_posts.count();
  console.log(`\n=== cafe_posts 테이블 ===`);
  console.log(`  총 건수: ${cafePostsCount}건 (Phase 2b 시작 전 기준)`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
