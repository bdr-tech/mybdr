/**
 * cafe-sync upsert 헬퍼 단위 테스트
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 무엇을 검증하는가
 * ──────────────────────────────────────────────────────────────────────────────
 * 2026-04-21 변경: game_type 결정 로직을 "board 강제 매핑" 으로 단순화했다.
 * parser 재분류 결과(parsed.gameType) 는 더 이상 game_type 에 영향 주지 않고,
 * 불일치 시에만 metadata.mixed_type_hint / parser_game_type 으로 보존된다.
 *
 * 이 테스트는 DB 접근 없이 두 pure 함수만 검증:
 *   - resolveGameType(board)
 *   - buildMetadataHints(board, parsed, resolvedType)
 *
 * 시나리오 4건:
 *   1. IVHA(PICKUP) + parsed.gameType=1(GUEST) → game_type=0, hint 기록
 *   2. Dilr(GUEST)  + parsed.gameType=0(PICKUP) → game_type=1, hint 기록
 *   3. MptT(PRACTICE) + parsed.gameType=1(GUEST 혼입) → game_type=2, hint 기록
 *   4. 일치 또는 parsed null/gameType=null → hint 없음 (3가지 서브케이스)
 */

import { describe, it, expect } from "vitest";
import type { CafeBoard } from "@/lib/cafe-sync/board-map";
import type { ParsedCafeGame } from "@/lib/parsers/cafe-game-parser";
import { resolveGameType, buildMetadataHints } from "@/lib/cafe-sync/upsert";

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 고정값 — board-map.ts 의 CAFE_BOARDS 와 동일 구조 (의존 안 하도록 복제)
// ─────────────────────────────────────────────────────────────────────────────

const IVHA: CafeBoard = { id: "IVHA", target: "games", gameType: "PICKUP", prefix: "PU", label: "픽업게임" };
const Dilr: CafeBoard = { id: "Dilr", target: "games", gameType: "GUEST", prefix: "GU", label: "게스트 모집" };
const MptT: CafeBoard = { id: "MptT", target: "games", gameType: "PRACTICE", prefix: "PR", label: "연습 경기" };

describe("upsert helpers — game_type board 강제 매핑 (2026-04-21)", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 시나리오 1: IVHA + 게스트 모집 본문 (parser 오분류 케이스)
  // ───────────────────────────────────────────────────────────────────────────
  it("IVHA + parser=GUEST(1) → game_type=0(PICKUP), mixed_type_hint 기록", () => {
    // 왜: 운영자가 픽업 게시판(IVHA)에 올렸는데 본문에 "게스트 모집" 키워드가
    //     섞여 parser 가 1(GUEST) 로 판정한 실제 오분류 패턴.
    //     board 강제 후 game_type=0(PICKUP), 단 parser 결과는 hint 로 보존.
    const resolved = resolveGameType(IVHA);
    expect(resolved).toBe(0);

    const parsed: ParsedCafeGame = { gameType: 1 };
    const hints = buildMetadataHints(IVHA, parsed, resolved);

    expect(hints.parser_game_type).toBe(1);
    expect(hints.mixed_type_hint).toEqual({
      suggested_type: "GUEST",
      reason: "parser_mismatch_board_forced",
      original_parser_type: 1,
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 시나리오 2: Dilr + 픽업게임 본문 (parser 오분류 케이스)
  // ───────────────────────────────────────────────────────────────────────────
  it("Dilr + parser=PICKUP(0) → game_type=1(GUEST), mixed_type_hint 기록", () => {
    // 왜: 게스트 게시판(Dilr)에 올린 글이 본문에 "픽업게임 모집" 을 포함해서
    //     parser 가 0(PICKUP) 으로 판정한 패턴. 운영자 의도는 게스트 모집.
    const resolved = resolveGameType(Dilr);
    expect(resolved).toBe(1);

    const parsed: ParsedCafeGame = { gameType: 0 };
    const hints = buildMetadataHints(Dilr, parsed, resolved);

    expect(hints.parser_game_type).toBe(0);
    expect(hints.mixed_type_hint).toEqual({
      suggested_type: "PICKUP",
      reason: "parser_mismatch_board_forced",
      original_parser_type: 0,
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 시나리오 3: MptT + 게스트 혼입 본문 (2026-04-20 에 이미 board 강제였던 케이스)
  // ───────────────────────────────────────────────────────────────────────────
  it("MptT + parser=GUEST(1) → game_type=2(PRACTICE), mixed_type_hint 기록", () => {
    // 왜: 연습경기 게시판(MptT) 글에 "게스트 모집" 문구가 섞여 parser 가
    //     1(GUEST) 로 판정한 패턴. 실측에서 5건 중 4건이 이 케이스였음.
    //     2026-04-20 에 MptT 만 board 강제였으나 2026-04-21 이후 3개 전부 동일.
    const resolved = resolveGameType(MptT);
    expect(resolved).toBe(2);

    const parsed: ParsedCafeGame = { gameType: 1 };
    const hints = buildMetadataHints(MptT, parsed, resolved);

    expect(hints.parser_game_type).toBe(1);
    expect(hints.mixed_type_hint).toEqual({
      suggested_type: "GUEST",
      reason: "parser_mismatch_board_forced",
      original_parser_type: 1,
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 시나리오 4: 힌트 미기록 3가지 서브케이스 (조건 검증)
  // ───────────────────────────────────────────────────────────────────────────
  it("parser 결과가 board 매핑과 같거나 null 이면 mixed_type_hint 없음", () => {
    // 4-a) parsed.gameType === resolved (IVHA + parser 도 PICKUP(0)) → 힌트 없음
    // 왜: 혼재 글이 아니므로 hint 기록 불필요. JSON 깨끗하게 유지.
    const hintsMatch = buildMetadataHints(
      IVHA,
      { gameType: 0 } satisfies ParsedCafeGame,
      resolveGameType(IVHA), // 0
    );
    expect(hintsMatch).toEqual({});

    // 4-b) parsed.gameType === null (parser 미분류) → 힌트 없음
    // 왜: parser 가 본문 키워드에서 유형을 뽑지 못한 경우. 오분류 정보가 없음.
    const hintsNull = buildMetadataHints(
      Dilr,
      { gameType: null } satisfies ParsedCafeGame,
      resolveGameType(Dilr), // 1
    );
    expect(hintsNull).toEqual({});

    // 4-c) parsed === null (parser 전체 실패) → 힌트 없음
    // 왜: ParsedCafeGame 객체 자체가 없는 케이스. 비교 대상 자체가 없어 힌트 불필요.
    const hintsNoParsed = buildMetadataHints(MptT, null, resolveGameType(MptT));
    expect(hintsNoParsed).toEqual({});
  });
});
