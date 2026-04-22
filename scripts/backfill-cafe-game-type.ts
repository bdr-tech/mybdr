/**
 * [2026-04-21] 카페 출처 games 의 game_type 을 board 기반 정답값으로 재정비.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 목적
 * ──────────────────────────────────────────────────────────────────────────────
 * 2026-04-21 기준 upsert.ts 는 `resolveGameType(board)` 로 board 강제 매핑을 쓴다.
 * 그러나 2026-04-20 이전 insert 된 레코드는 `parsed.gameType` 을 우선 신뢰한
 * 구 로직 결과라서 board 매핑과 어긋나는 건이 있다.
 *
 *   - IVHA(PICKUP) 글인데 game_type=1(GUEST) 로 저장 → "게스트 모집" 키워드 혼입 오분류
 *   - Dilr(GUEST)  글인데 game_type=0(PICKUP) 로 저장 → "픽업게임" 키워드 혼입 오분류
 *   - MptT(PRACTICE) 글인데 game_type != 2                → "게스트 모집" 키워드 혼입 오분류 (2026-04-20 이전 분만 남아있음)
 *
 * 이 스크립트는 위 3가지를 한 번에 정리한다.
 *
 *   - game_type 을 board 기반 정답값으로 UPDATE
 *   - 기존 game_type 은 metadata.mixed_type_hint 로 보존 (정보 손실 방지)
 *   - metadata.parser_game_type 에도 동일값 기록 (admin 쿼리 편의)
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 사용법
 * ──────────────────────────────────────────────────────────────────────────────
 *   # dry-run (기본). 게시판별 변경 건수 + 상위 5건 샘플만 출력, DB 쓰기 0.
 *   npx tsx --env-file=.env --env-file=.env.local scripts/backfill-cafe-game-type.ts
 *
 *   # 실제 실행 — 개발 DB 가드 통과 시에만 UPDATE. 반드시 dry-run 선행 + PM 승인 후 실행.
 *   npx tsx --env-file=.env --env-file=.env.local scripts/backfill-cafe-game-type.ts --execute
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 안전장치
 * ──────────────────────────────────────────────────────────────────────────────
 *   - 운영 DB 차단: DATABASE_URL 에 "bwoorsgoijvlgutkrcvs" 포함 여부 검사.
 *   - dry-run 기본 모드.
 *   - game_type 이 이미 정답이면 skip (멱등).
 *   - cafe_board 키 없으면 skip (카페 출처 아닌 레코드 보호).
 *   - DELETE 없음. game_type + metadata 2필드만 수정.
 *   - CafeBoard 매핑은 upsert.ts 에서 export 한 resolveGameType 을 재사용 (중복 매핑 금지).
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { CAFE_BOARDS, getBoardById, type CafeBoard } from "../src/lib/cafe-sync/board-map";
import { resolveGameType } from "../src/lib/cafe-sync/upsert";

const prisma = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");

// 운영 DB 차단 가드 — 다른 카페 sync 스크립트와 동일 상수.
const DEV_DB_IDENTIFIER = "bwoorsgoijvlgutkrcvs";

// upsert.ts 의 labelOfGameType 과 동일 — export 되지 않아 로컬 복제.
// (게임 타입 숫자 → 라벨 변환. 3줄이라 의존성 최소화 목적.)
function labelOfGameType(n: number): "PICKUP" | "GUEST" | "PRACTICE" {
  if (n === 0) return "PICKUP";
  if (n === 1) return "GUEST";
  return "PRACTICE";
}

interface TargetRow {
  id: bigint;
  game_type: number | null;
  metadata: Prisma.JsonValue;
}

async function main() {
  // 1) 운영 DB 차단
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.includes(DEV_DB_IDENTIFIER)) {
    console.error("🛑 운영 DB 가드: DATABASE_URL 이 개발 DB 가 아닙니다.");
    console.error(`   개발 DB 식별자 "${DEV_DB_IDENTIFIER}" 를 포함해야 실행 가능합니다.`);
    process.exit(1);
  }

  const mode = EXECUTE ? "[EXECUTE]" : "[DRY RUN]";
  console.log("============================================================");
  console.log(`${mode} cafe game_type board 강제 매핑 백필 시작 (2026-04-21)`);
  console.log("============================================================\n");

  // 2) 대상 조회 — cafe_board 키를 가진 카페 출처 games 전체.
  //    raw SQL 인 이유: Prisma 6.x 는 JSON key 존재 조건 공식 지원 없음.
  const targets = await prisma.$queryRaw<TargetRow[]>`
    SELECT id, game_type, metadata
    FROM games
    WHERE metadata ? 'cafe_board'
    ORDER BY created_at DESC
  `;

  console.log(`전체 카페 출처 games: ${targets.length}건\n`);

  if (targets.length === 0) {
    console.log("카페 출처 레코드가 없습니다. 종료.");
    await prisma.$disconnect();
    return;
  }

  // 3) 게시판별 × 현재 game_type 매트릭스 집계 (전 현황)
  //    board → gameType(현재값) → count
  const matrix = new Map<string, Map<number, number>>();
  for (const b of CAFE_BOARDS) matrix.set(b.id, new Map());

  for (const row of targets) {
    const meta = row.metadata as Record<string, unknown> | null;
    const boardId = String(meta?.cafe_board ?? "");
    const board = getBoardById(boardId);
    if (!board) continue;
    const gt = row.game_type ?? -1;
    const boardMap = matrix.get(board.id)!;
    boardMap.set(gt, (boardMap.get(gt) ?? 0) + 1);
  }

  // 4) 변경 대상 식별 + 카운트 + 샘플 수집
  //    changeCountByBoardType[boardId][currentGameType] = N 건 예정
  const changeCount = new Map<string, Map<number, number>>();
  for (const b of CAFE_BOARDS) changeCount.set(b.id, new Map());

  const toUpdate: Array<{
    row: TargetRow;
    board: CafeBoard;
    correctType: number;
    currentType: number;
  }> = [];

  let skippedNoBoard = 0;
  let skippedUnknownBoard = 0;
  let alreadyCorrect = 0;

  for (const row of targets) {
    const meta = row.metadata as Record<string, unknown> | null;
    if (!meta) {
      skippedNoBoard++;
      continue;
    }
    const boardId = String(meta.cafe_board ?? "");
    const board = getBoardById(boardId);
    if (!board) {
      skippedUnknownBoard++;
      console.warn(`  ⚠️  id=${row.id} cafe_board="${boardId}" — 매핑 없음, skip`);
      continue;
    }

    const correct = resolveGameType(board);
    const current = row.game_type ?? -1;

    if (current === correct) {
      alreadyCorrect++;
      continue;
    }

    // 변경 대상 집계
    const boardChange = changeCount.get(board.id)!;
    boardChange.set(current, (boardChange.get(current) ?? 0) + 1);

    toUpdate.push({ row, board, correctType: correct, currentType: current });
  }

  // 5) 현황 매트릭스 출력
  console.log("── 게시판별 × 현재 game_type 현황 ──");
  for (const b of CAFE_BOARDS) {
    const boardMap = matrix.get(b.id)!;
    const correct = resolveGameType(b);
    const parts = [...boardMap.entries()]
      .sort(([a], [c]) => a - c)
      .map(([gt, n]) => {
        const mark = gt === correct ? "✅" : "❌";
        return `${mark} game_type=${gt}: ${n}건`;
      });
    console.log(`  ${b.id}(${b.gameType}, 정답=${correct}): ${parts.join(" / ") || "0건"}`);
  }
  console.log("");

  // 6) 변경 예정 매트릭스
  console.log("── 게시판별 × game_type 변경 예정 ──");
  let totalToChange = 0;
  for (const b of CAFE_BOARDS) {
    const boardChange = changeCount.get(b.id)!;
    const correct = resolveGameType(b);
    if (boardChange.size === 0) {
      console.log(`  ${b.id}: 변경 없음 (전부 game_type=${correct})`);
      continue;
    }
    const parts = [...boardChange.entries()]
      .sort(([a], [c]) => a - c)
      .map(([from, n]) => `game_type=${from} → ${correct}: ${n}건`);
    for (const [, n] of boardChange) totalToChange += n;
    console.log(`  ${b.id}: ${parts.join(" / ")}`);
  }
  console.log(`\n변경 예정 합계: ${totalToChange}건 / 이미 정답: ${alreadyCorrect}건`);
  if (skippedNoBoard > 0) console.log(`metadata 없음 skip: ${skippedNoBoard}건`);
  if (skippedUnknownBoard > 0) console.log(`알 수 없는 board skip: ${skippedUnknownBoard}건`);
  console.log("");

  // 7) 상위 5건 샘플
  if (toUpdate.length > 0) {
    console.log("── 상위 5건 샘플 (id / board / current → correct / dataid) ──");
    for (const item of toUpdate.slice(0, 5)) {
      const meta = item.row.metadata as Record<string, unknown> | null;
      const dataid = meta?.cafe_dataid ?? "?";
      console.log(
        `  id=${item.row.id} [${item.board.id}] game_type ${item.currentType} → ${item.correctType} (dataid=${dataid})`,
      );
    }
    console.log("");
  }

  if (toUpdate.length === 0) {
    console.log("✨ 변경 대상 없음 — 전체 레코드가 이미 board 기반 정답값입니다.");
    await prisma.$disconnect();
    return;
  }

  // 8) 실제 UPDATE (EXECUTE 모드만)
  let updated = 0;
  let failed = 0;

  for (const item of toUpdate) {
    const meta = (item.row.metadata as Record<string, unknown>) ?? {};

    // metadata 재조립 — 기존 키 보존 + mixed_type_hint / parser_game_type 추가.
    // 왜: upsert.ts 의 buildMetadataHints 와 동일 구조로 저장해 후속 admin 필터가
    //     실시간 데이터와 백필 데이터를 한 규칙으로 읽게 한다.
    //     reason 만 "backfill_2026-04-21" 로 구분 (parser_mismatch_board_forced 와 대비).
    const originalType = item.currentType as 0 | 1 | 2;
    const newMeta = {
      ...meta,
      mixed_type_hint: {
        suggested_type: labelOfGameType(originalType),
        reason: "backfill_2026-04-21",
        original_parser_type: originalType,
      },
      parser_game_type: originalType,
    };

    if (!EXECUTE) {
      updated++;
      continue;
    }

    try {
      await prisma.games.update({
        where: { id: item.row.id },
        data: {
          game_type: item.correctType,
          metadata: newMeta as unknown as Prisma.InputJsonValue,
        },
      });
      updated++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ id=${item.row.id} UPDATE 실패: ${msg}`);
    }
  }

  // 9) 요약
  console.log("============================================================");
  console.log(`${mode} 결과`);
  console.log("============================================================");
  console.log(`적용 건수${EXECUTE ? "" : " (dry-run)"}: ${updated}건`);
  if (EXECUTE) {
    console.log(`UPDATE 실패: ${failed}건`);
    console.log(`\n💾 실제 UPDATE 수행됨. 검증 쿼리로 board × game_type 정합 확인 권장.`);
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
