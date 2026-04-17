/**
 * games 테이블의 깨진 컬럼을 description(카페 본문 원문)으로부터 백필.
 *
 * 왜 이 스크립트가 필요한가:
 *   외부 크롤러가 본문만 넣고 구조화 필드(venue_name/city/fee_per_person/scheduled_at)를
 *   비워둔 채로 games 에 적재함. inspect 결과 262건 중
 *     - venue_name NULL 116건 (44%)
 *     - city NULL 106건 (40%)
 *     - fee=0 245건 (93%)
 *     - scheduled_at 전부 INSERT 시각 (본문의 "일시"와 무관)
 *   본문 양식이 "N. 라벨 : 값" 으로 매우 일관적이라 정규식 한 번에 복구 가능.
 *
 * 사용법:
 *   1) dry-run (기본)     — npx tsx scripts/backfill-games-from-cafe.ts
 *   2) 실제 실행          — npx tsx scripts/backfill-games-from-cafe.ts --execute
 *                            ⚠️  현재 단계에서는 절대 --execute 금지.
 *                            dry-run 결과 tester/reviewer 검증 후에만 허용.
 *
 * 파서:
 *   src/lib/parsers/cafe-game-parser.ts (DB 의존 없는 순수 함수)
 *
 * 규칙:
 *   - 빈(비어있는) 컬럼만 채움 (덮어쓰기 금지)
 *     * venue_name: NULL 일 때만
 *     * city / district: NULL 일 때만
 *     * fee_per_person: 0 또는 NULL 일 때만
 *     * scheduled_at: created_at 과 거의 같으면 (=INSERT 시각 그대로) 교체
 *   - 데이터 변환 실패 (파싱 못함) → skip
 *   - DELETE 절대 없음
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { parseCafeGame, ParsedCafeGame } from "../src/lib/parsers/cafe-game-parser";

const prisma = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");

// 운영 DB 차단 가드: --execute 시 개발 DB(bwoorsgoijvlgutkrcvs)가 아니면 abort.
// 실수로 운영 DB에 백필이 들어가는 사고 방지.
if (EXECUTE) {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const DEV_DB_HOST = "bwoorsgoijvlgutkrcvs";
  if (!dbUrl.includes(DEV_DB_HOST)) {
    const masked = dbUrl.replace(/:[^:@]*@/, ":***@").slice(0, 100);
    console.error("\n🚨 운영 DB로 추정 — 백필 실행 차단");
    console.error(`현재 DB: ${masked}...`);
    console.error(`허용 호스트 식별자: ${DEV_DB_HOST}`);
    console.error("→ 운영 DB 백필이 필요하면 별도 협의 후 가드 식별자를 명시적으로 변경하세요.\n");
    process.exit(1);
  }
}

// "scheduled_at 이 created_at 과 거의 같다" 판정 허용 오차 (초)
// INSERT 트리거 타이밍 차이로 수 초 차이가 날 수 있어 5분 버퍼
const SCHEDULED_CREATED_DIFF_THRESHOLD_MS = 5 * 60 * 1000;

interface Row {
  id: bigint;
  description: string | null;
  venue_name: string | null;
  city: string | null;
  district: string | null;
  fee_per_person: number | null;
  scheduled_at: Date;
  created_at: Date;
  title: string | null;
}

interface Fillable {
  venue_name?: string;
  city?: string;
  district?: string;
  fee_per_person?: number;
  scheduled_at?: Date;
}

/**
 * 파싱 결과 + 현재 값 비교 → 실제로 채울 수 있는 필드만 추출.
 *
 * 채움 조건:
 *   venue_name: 현재 NULL && 파서가 값 생성
 *   city:       현재 NULL && 파서가 값 생성
 *   district:   현재 NULL && 파서가 값 생성
 *   fee:        현재 0 또는 NULL && 파서가 값 생성
 *   scheduled_at: 파서가 값 생성 && 현재 scheduled_at 이 created_at 과 5분 이내
 *                 (즉 INSERT 시각을 그대로 쓰고 있는 깨진 상태일 때만)
 */
function computeFillable(row: Row, parsed: ParsedCafeGame): Fillable {
  const out: Fillable = {};
  if (row.venue_name == null && parsed.venueName) out.venue_name = parsed.venueName;
  if (row.city == null && parsed.city) out.city = parsed.city;
  if (row.district == null && parsed.district) out.district = parsed.district;
  if ((row.fee_per_person == null || row.fee_per_person === 0) && parsed.feePerPerson !== undefined) {
    out.fee_per_person = parsed.feePerPerson;
  }
  if (parsed.scheduledAt) {
    const diff = Math.abs(row.scheduled_at.getTime() - row.created_at.getTime());
    if (diff <= SCHEDULED_CREATED_DIFF_THRESHOLD_MS) {
      // 현재 scheduled_at 이 "본문의 일시"가 아니라 INSERT 시각으로 추정 → 교체 허용
      out.scheduled_at = parsed.scheduledAt;
    }
  }
  return out;
}

async function main() {
  const mode = EXECUTE ? "[EXECUTE]" : "[DRY RUN]";
  console.log(`${mode} games 백필 — cafe 본문 파서 기반\n`);

  // 대상: description 이 채워진 모든 게임 (본문 없으면 복구 불가)
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT
      id, description, venue_name, city, district,
      fee_per_person, scheduled_at, created_at, title
    FROM games
    WHERE description IS NOT NULL
    ORDER BY id ASC
  `);

  console.log(`대상(description 존재): ${rows.length}건\n`);

  // 집계 변수
  let parseFail = 0;             // 본문이 있으나 파서가 라벨 1개도 못 찾음
  let noFillable = 0;            // 파싱은 됐지만 채울 게 없음 (이미 다 채워져 있거나 파서가 값 못뽑음)
  let fillableAny = 0;           // 1개 이상 채울 수 있는 행
  const byField = {
    venue_name: 0,
    city: 0,
    district: 0,
    fee_per_person: 0,
    scheduled_at: 0,
  };
  let updated = 0;               // EXECUTE 시 실제 UPDATE 수

  // 예시 출력용 버퍼 (최대 5건)
  const sampleLines: string[] = [];

  for (const row of rows) {
    if (!row.description) continue;
    const { data: parsed, stats } = parseCafeGame(row.description, row.created_at);

    if (stats.matchedLines === 0) {
      parseFail++;
      continue;
    }

    const fill = computeFillable(row, parsed);
    const keys = Object.keys(fill) as (keyof Fillable)[];
    if (keys.length === 0) {
      noFillable++;
      continue;
    }

    fillableAny++;
    for (const k of keys) byField[k]++;

    if (sampleLines.length < 5) {
      const summary = keys
        .map((k) => {
          const v = fill[k];
          const s = v instanceof Date ? v.toISOString() : String(v);
          return `${k}=${s}`;
        })
        .join(", ");
      sampleLines.push(
        `  [id=${row.id}] "${(row.title ?? "").slice(0, 24)}"\n     → ${summary}`,
      );
    }

    if (EXECUTE) {
      // 실행 경로: venue_name/city/district/fee_per_person/scheduled_at 중
      // 존재하는 키만 UPDATE. Prisma.validator 대신 단순 분기.
      await prisma.games.update({
        where: { id: row.id },
        data: {
          ...(fill.venue_name !== undefined && { venue_name: fill.venue_name }),
          ...(fill.city !== undefined && { city: fill.city }),
          ...(fill.district !== undefined && { district: fill.district }),
          ...(fill.fee_per_person !== undefined && { fee_per_person: fill.fee_per_person }),
          ...(fill.scheduled_at !== undefined && { scheduled_at: fill.scheduled_at }),
        },
      });
      updated++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 리포트
  // ─────────────────────────────────────────────────────────────
  console.log("====== 파싱/채움 집계 ======");
  console.log(`  파싱 실패 (라벨 0개):      ${parseFail}건`);
  console.log(`  파싱 OK, 채울 것 없음:     ${noFillable}건`);
  console.log(`  파싱 OK, 채울 것 있음:     ${fillableAny}건`);
  console.log("");
  console.log("====== 항목별 채움 가능 건수 ======");
  console.log(`  venue_name:      ${byField.venue_name}건`);
  console.log(`  city:            ${byField.city}건`);
  console.log(`  district:        ${byField.district}건`);
  console.log(`  fee_per_person:  ${byField.fee_per_person}건`);
  console.log(`  scheduled_at:    ${byField.scheduled_at}건`);

  console.log("");
  console.log("====== 샘플 (최대 5건) ======");
  if (sampleLines.length === 0) {
    console.log("  (채울 항목 없음)");
  } else {
    console.log(sampleLines.join("\n"));
  }

  console.log("");
  console.log("========================================");
  console.log(`${mode} 요약`);
  console.log("========================================");
  console.log(`대상: ${rows.length}건 / 채움 가능 행: ${fillableAny}건`);
  if (EXECUTE) {
    console.log(`\n💾 실제 UPDATE: ${updated}건`);
  } else {
    console.log(`\n💡 DRY RUN 완료. 실행하려면 --execute 플래그 사용.`);
    console.log(`   (단, 이번 단계에서는 --execute 금지. tester/reviewer 검증 후에만)`);
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
