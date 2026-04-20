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
// 게임 유형 재분류 모드 — 본문 키워드로 game_type 추정 결과 매트릭스 출력
// (UPDATE 절대 안 함. dry-run 매트릭스 + 표본만)
const RECLASSIFY_TYPES = process.argv.includes("--reclassify-types");

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
  game_type: number;
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
  console.log(`${mode} games 백필 — cafe 본문 파서 기반`);
  if (RECLASSIFY_TYPES) {
    console.log("--reclassify-types 플래그: game_type 매트릭스만 출력 (UPDATE 안 함)");
  }
  console.log("");

  // 대상: description 이 채워진 모든 게임 (본문 없으면 복구 불가)
  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT
      id, description, venue_name, city, district,
      fee_per_person, scheduled_at, created_at, title, game_type
    FROM games
    WHERE description IS NOT NULL
    ORDER BY id ASC
  `);

  console.log(`대상(description 존재): ${rows.length}건\n`);

  // 재분류 모드: --reclassify-types 단독은 매트릭스만, --execute 추가 시 UPDATE
  if (RECLASSIFY_TYPES) {
    await reclassifyTypesReport(rows);
    return;
  }

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

/**
 * --reclassify-types 모드: game_type 매트릭스 + 표본 출력 (UPDATE 절대 없음).
 *
 * 출력:
 *   1) current → inferred 매트릭스 (3x4: PICKUP/GUEST/PRACTICE × PICKUP/GUEST/PRACTICE/null)
 *   2) 변경 발생 행 카운트 (재분류 권장 건수)
 *   3) 표본 10건 (id / 제목 / current → inferred / 분류 단서)
 *   4) 위험 알림: PRACTICE → PICKUP 같이 강한 다운그레이드 케이스 별도 표시
 */
async function reclassifyTypesReport(rows: Row[]) {
  // 매트릭스: current(0/1/2) × inferred(0/1/2/null)
  // null 키는 -1 로 저장
  const NULL_KEY = -1;
  const matrix: Record<number, Record<number, number>> = {
    0: { 0: 0, 1: 0, 2: 0, [NULL_KEY]: 0 },
    1: { 0: 0, 1: 0, 2: 0, [NULL_KEY]: 0 },
    2: { 0: 0, 1: 0, 2: 0, [NULL_KEY]: 0 },
  };

  // 표본 버퍼 (current ≠ inferred 인 케이스 우선) + 위험 케이스 별도
  const samples: string[] = [];
  const risks: string[] = []; // PRACTICE(2) → PICKUP(0) 같은 강한 변경
  let totalChange = 0;       // current ≠ inferred && inferred ≠ null
  let parseFail = 0;          // 본문이 있어도 라벨 0개
  let updated = 0;            // EXECUTE 시 실제 UPDATE 카운트

  const TYPE_NAME: Record<number, string> = {
    0: "PICKUP",
    1: "GUEST",
    2: "PRACTICE",
    [NULL_KEY]: "null",
  };

  for (const row of rows) {
    if (!row.description) continue;
    const { data: parsed, stats } = parseCafeGame(row.description, row.created_at);

    if (stats.matchedLines === 0) {
      parseFail++;
      // 라벨 0개여도 키워드만으로 분류는 시도됨 — gameType 결과 그대로 사용
    }

    const inferred = parsed.gameType ?? null;
    const inferredKey = inferred ?? NULL_KEY;
    const cur = row.game_type;
    if (matrix[cur]) matrix[cur][inferredKey]++;

    // 변경 발생 행 (inferred null 은 "분류 보류"이므로 변경 카운트에서 제외)
    const isChange = inferred !== null && inferred !== cur;
    if (isChange) totalChange++;

    // --reclassify-types --execute 조합일 때만 실제 UPDATE
    // (--reclassify-types 단독은 매트릭스만 출력)
    if (isChange && EXECUTE) {
      await prisma.games.update({
        where: { id: row.id },
        data: { game_type: inferred as number },
      });
      updated++;
    }

    // 위험 케이스: PRACTICE(팀-팀) → PICKUP(픽업) 으로 잘못 분류되면 의미 다움
    //   PRACTICE → GUEST 는 게스트 모집글이 잘못 PRACTICE 로 들어가있던 것일 수 있어서 OK
    //   PICKUP → PRACTICE 도 잘못된 변경 가능성
    const isRisky =
      (cur === 2 && inferred === 0) ||
      (cur === 0 && inferred === 2);
    if (isRisky && risks.length < 10) {
      risks.push(
        `  [id=${row.id}] ${TYPE_NAME[cur]} → ${TYPE_NAME[inferred ?? NULL_KEY]}\n     title="${(row.title ?? "").slice(0, 60)}"`,
      );
    }

    // 일반 표본: current ≠ inferred 인 행 우선 (정상 변경 케이스)
    if (isChange && samples.length < 10) {
      samples.push(
        `  [id=${row.id}] ${TYPE_NAME[cur]} → ${TYPE_NAME[inferred ?? NULL_KEY]}\n     title="${(row.title ?? "").slice(0, 60)}"`,
      );
    }
  }

  // ─────────── 리포트 출력 ───────────
  console.log("====== 파싱 통계 ======");
  console.log(`  파싱 실패 (라벨 0개): ${parseFail}건 (gameType 은 키워드만으로 시도됨)\n`);

  console.log("====== game_type 재분류 매트릭스 (current → inferred) ======");
  console.log("  " + ["current\\inferred", "PICKUP", "GUEST", "PRACTICE", "null"].join(" | "));
  for (const cur of [0, 1, 2]) {
    const row = matrix[cur];
    console.log(
      "  " +
        [
          TYPE_NAME[cur].padEnd(17),
          String(row[0]).padStart(6),
          String(row[1]).padStart(5),
          String(row[2]).padStart(8),
          String(row[NULL_KEY]).padStart(4),
        ].join(" | "),
    );
  }

  console.log("");
  console.log(`====== 변경 발생 행 (current ≠ inferred, inferred ≠ null): ${totalChange}건 ======`);

  console.log("");
  console.log("====== 표본 10건 (변경 발생 케이스 우선) ======");
  if (samples.length === 0) {
    console.log("  (변경 발생 행 없음)");
  } else {
    console.log(samples.join("\n"));
  }

  if (risks.length > 0) {
    console.log("");
    console.log("⚠️ ====== 위험 알림: 강한 다운그레이드 (PRACTICE↔PICKUP 교차) ======");
    console.log(risks.join("\n"));
    console.log("→ 이 행들은 키워드 단서가 약하거나 본문이 짧을 가능성. 수동 검토 권장.");
  }

  console.log("");
  console.log("========================================");
  const modeLabel = EXECUTE ? "[EXECUTE]" : "[DRY RUN]";
  console.log(`${modeLabel} --reclassify-types 요약`);
  console.log("========================================");
  console.log(`대상 ${rows.length}건 중 재분류 권장 ${totalChange}건 / 위험 케이스 ${risks.length}건`);
  if (EXECUTE) {
    console.log(`💾 실제 game_type UPDATE: ${updated}건`);
  } else {
    console.log("💡 매트릭스/표본만 출력. 실제 UPDATE 는 --execute 추가 시.");
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
