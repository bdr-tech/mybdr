/**
 * [TMP 2026-04-20] 기존 카페 출처 games 에 `metadata.cafe_article_id` (Int) 백필.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 목적
 * ──────────────────────────────────────────────────────────────────────────────
 * Phase 2b 까지 insert 된 카페 출처 games(약 15건) 는 `metadata.cafe_dataid` (string) 만 갖는다.
 * 2026-04-20 정렬 tie-break 도입으로 `metadata.cafe_article_id` (Int) 키가 새로 필요하다.
 * 이 스크립트는 cafe_dataid 를 정수로 변환해 cafe_article_id 에 복제한다.
 *
 * 새로 수집되는 글은 fetcher.ts → upsert.ts 체인에서 cafe_article_id 가 자동 채워지므로
 * 본 스크립트는 일회성 정비용이다. 실행 완료 후 파일 삭제 권장.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 사용법
 * ──────────────────────────────────────────────────────────────────────────────
 *   # dry-run (기본). 대상 건수 + 샘플 5건만 출력, DB 쓰기 0.
 *   npx tsx --env-file=.env --env-file=.env.local scripts/_tmp-backfill-cafe-article-id.ts
 *
 *   # 실제 실행 — 개발 DB 가드 통과 시에만 UPDATE.
 *   npx tsx --env-file=.env --env-file=.env.local scripts/_tmp-backfill-cafe-article-id.ts --execute
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 안전장치
 * ──────────────────────────────────────────────────────────────────────────────
 *   - 운영 DB 차단: DATABASE_URL 에 "bwoorsgoijvlgutkrcvs" 포함 여부 검사 (다른 카페 스크립트와 동일 관습).
 *   - dry-run 기본 모드.
 *   - cafe_article_id 가 이미 존재하면 skip (재실행 멱등성).
 *   - cafe_dataid 가 비숫자인 레코드 skip (NaN 가드).
 *   - UPDATE 만 수행, DELETE 없음.
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");

// 운영 DB 차단 가드 — 다른 카페 sync 스크립트와 동일한 상수.
const DEV_DB_IDENTIFIER = "bwoorsgoijvlgutkrcvs";

async function main() {
  // 1) 운영 DB 차단
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.includes(DEV_DB_IDENTIFIER)) {
    console.error("🛑 운영 DB 가드: DATABASE_URL 이 개발 DB 가 아닙니다.");
    console.error(`   개발 DB 식별자 "${DEV_DB_IDENTIFIER}" 를 포함해야 실행 가능합니다.`);
    process.exit(1);
  }

  const mode = EXECUTE ? "[EXECUTE]" : "[DRY RUN]";
  console.log("========================================");
  console.log(`${mode} metadata.cafe_article_id 백필 시작`);
  console.log("========================================\n");

  // 2) 대상 조회 — cafe_dataid 보유 + cafe_article_id 미보유.
  //    왜 raw SQL: Prisma 는 JSON path 조건을 공식 지원 안 함 (Prisma 6.x).
  const targets = await prisma.$queryRaw<
    Array<{ id: bigint; metadata: Prisma.JsonValue }>
  >`
    SELECT id, metadata
    FROM games
    WHERE metadata ? 'cafe_dataid'
      AND NOT (metadata ? 'cafe_article_id')
    ORDER BY created_at DESC
  `;

  console.log(`대상 건수 (cafe_dataid 보유 + cafe_article_id 미보유): ${targets.length}건\n`);

  if (targets.length === 0) {
    console.log("✨ 백필 대상 없음 — 이미 모든 카페 레코드가 cafe_article_id 를 보유했거나,");
    console.log("   cafe_dataid 를 가진 레코드가 없습니다.");
    await prisma.$disconnect();
    return;
  }

  // 3) 샘플 출력 (최대 5건) — 변환 전/후 비교용
  console.log("── 샘플 (최대 5건) ──");
  const samples = targets.slice(0, 5);
  for (const row of samples) {
    const meta = row.metadata as Record<string, unknown> | null;
    const rawDataid = meta?.cafe_dataid;
    const parsed = parseInt(String(rawDataid ?? ""), 10);
    const valid = Number.isFinite(parsed);
    console.log(
      `  id=${row.id} cafe_dataid="${rawDataid}" → cafe_article_id=${
        valid ? parsed : "SKIP (비숫자)"
      }`,
    );
  }
  console.log("");

  // 4) 집계용 카운터
  let updated = 0;
  let skippedNaN = 0;
  let skippedNoMeta = 0;
  let failed = 0;

  // 5) 실제 백필 루프
  for (const row of targets) {
    const meta = row.metadata as Record<string, unknown> | null;
    if (!meta || typeof meta !== "object") {
      skippedNoMeta++;
      continue;
    }

    const rawDataid = meta.cafe_dataid;
    const parsed = parseInt(String(rawDataid ?? ""), 10);

    if (!Number.isFinite(parsed)) {
      skippedNaN++;
      console.warn(`  ⚠️  id=${row.id} cafe_dataid="${rawDataid}" — 비숫자, skip`);
      continue;
    }

    // 새 metadata 객체 조립 — 기존 키 보존 + cafe_article_id 추가.
    const newMeta = {
      ...meta,
      cafe_article_id: parsed,
    };

    if (!EXECUTE) {
      // dry-run — 실제 UPDATE 안 함
      updated++;
      continue;
    }

    try {
      await prisma.games.update({
        where: { id: row.id },
        data: { metadata: newMeta as unknown as Prisma.InputJsonValue },
      });
      updated++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ id=${row.id} UPDATE 실패: ${msg}`);
    }
  }

  // 6) 요약
  console.log("\n========================================");
  console.log(`${mode} 결과`);
  console.log("========================================");
  console.log(`✅ 백필 대상 적용${EXECUTE ? "" : " (dry-run)"}: ${updated}건`);
  console.log(`⚠️  비숫자 dataid skip: ${skippedNaN}건`);
  console.log(`⚠️  metadata 비어있음 skip: ${skippedNoMeta}건`);
  if (EXECUTE) {
    console.log(`❌ UPDATE 실패: ${failed}건`);
    console.log(`\n💾 실제 UPDATE 수행됨.`);
  } else {
    console.log(`\n💡 DRY RUN — 실제 UPDATE 안 됨. --execute 추가 시 실행됩니다.`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
