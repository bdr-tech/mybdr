/**
 * 다음카페 3개 게시판 동기화 실행기 (Phase 1 POC — dry-run 전용).
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 9가드 체크리스트 (Phase 1 범위)
 * ──────────────────────────────────────────────────────────────────────────────
 *   [x] 1. 요청 간격 3초 유지       — fetcher.fetchBoardList 내 sleep(3000)
 *   [x] 2. 새벽 1~6시 회피          — 수동 실행. Phase 3 cron에서 강제
 *   [x] 3. 수빈 본인 계정 쿠키만    — Phase 1은 쿠키 불필요
 *   [x] 4. 본문 UI 요약만           — Phase 1은 본문 fetch 안 함
 *   [x] 5. 전화/계좌 마스킹         — 해당 없음 (본문 무관)
 *   [x] 6. 삭제 요청 프로세스       — Phase 3
 *   [x] 7. 일반 모바일 UA           — fetcher에서 관리
 *   [x] 8. 403/429 3회 연속 중단    — 본 스크립트가 카운터 관리
 *   [x] 9. 공식 요청 즉시 중단      — 운영 별도 대응
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * 사용법:
 *   npx tsx scripts/sync-cafe.ts                              # 3개 게시판 각 10건
 *   npx tsx scripts/sync-cafe.ts --board=IVHA --limit=5       # IVHA 5건만
 *   npx tsx scripts/sync-cafe.ts --board=all --limit=3        # all 명시도 OK
 *   npx tsx scripts/sync-cafe.ts --board=IVHA --limit=5 --debug  # 디버그 (응답 HTML 저장)
 *
 * Phase 1 원칙:
 *   - DB 쓰기 0 (prisma import 금지)
 *   - --execute 플래그 차단 (Phase 2 이후 지원)
 *   - 콘솔 출력만
 */

import { CAFE_BOARDS, CafeBoard, getBoardById } from "../src/lib/cafe-sync/board-map";
import { fetchBoardList, BoardItem } from "../src/lib/cafe-sync/fetcher";

// ─────────────────────────────────────────────────────────────────────────────
// --execute 가드 (Phase 1은 dry-run 전용)
// ─────────────────────────────────────────────────────────────────────────────

if (process.argv.includes("--execute")) {
  console.error("⚠️ --execute는 Phase 2 이후에 지원됩니다. Phase 1은 dry-run 전용.");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 인자 파싱
// ─────────────────────────────────────────────────────────────────────────────

/** --board=IVHA | Dilr | MptT | all */
function parseBoardArg(): CafeBoard[] {
  const arg = process.argv.find((a) => a.startsWith("--board="));
  if (!arg) return CAFE_BOARDS; // 기본: 전체
  const val = arg.split("=")[1];
  if (!val || val === "all") return CAFE_BOARDS;
  const b = getBoardById(val);
  if (!b) {
    console.error(`⚠️ 알 수 없는 게시판 id: "${val}". 허용값: IVHA | Dilr | MptT | all`);
    process.exit(1);
  }
  return [b];
}

/** --limit=N (기본 10) */
function parseLimitArg(): number {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  if (!arg) return 10;
  const n = Number(arg.split("=")[1]);
  if (!Number.isFinite(n) || n < 1 || n > 50) {
    console.error(`⚠️ --limit 값이 유효하지 않음 (1~50): "${arg}"`);
    process.exit(1);
  }
  return Math.floor(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// 출력 포맷 유틸
// ─────────────────────────────────────────────────────────────────────────────

/** 현재 시각 "YYYY-MM-DD HH:MM:SS" KST 표기 (로그용) */
function nowStamp(): string {
  // KST (UTC+9)로 수동 변환
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())} ` +
    `${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}:${pad(kst.getUTCSeconds())}`
  );
}

/** Date → "YYYY-MM-DD HH:MM" KST 표기. null이면 "-" */
function formatKst(d: Date | null): string {
  if (!d) return "-";
  const kst = new Date(d.getTime() + 9 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())} ` +
    `${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`
  );
}

/** 한 게시판 결과 콘솔 출력 */
function printBoardResult(board: CafeBoard, items: BoardItem[]): void {
  console.log(`[${nowStamp()}] [${board.id} ${board.label}] ${items.length}건 수집`);
  items.forEach((it, idx) => {
    console.log(
      `  ${idx + 1}. "${it.title}" ` +
        `(dataid=${it.dataid}, author=${it.author || "-"}, posted=${formatKst(it.postedAt)})`,
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const targets = parseBoardArg();
  const limit = parseLimitArg();
  // --debug 플래그: fetcher에 전달하여 응답 HTML 덤프 + 진단 정보 출력 활성화.
  const debug = process.argv.includes("--debug");

  console.log("========================================");
  console.log("[DRY RUN] 다음카페 동기화 Phase 1 POC");
  console.log("========================================");
  console.log(
    `대상 게시판: ${targets.map((b) => `${b.id}(${b.label})`).join(", ")} / limit=${limit}${debug ? " / debug=ON" : ""}`,
  );
  console.log("");

  // 집계
  const perBoardCount: Record<string, number> = {};
  const failedBoards: string[] = [];

  // 9가드 8번 — 403/429 3회 연속 시 전체 중단
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 3;

  for (const board of targets) {
    try {
      // debug 플래그를 fetcher로 전파 — 응답 HTML 덤프 + 진단 정보 출력
      const items = await fetchBoardList(board, limit, { debug });
      printBoardResult(board, items);
      console.log(""); // 게시판 간 구분 빈 줄
      perBoardCount[board.id] = items.length;
      consecutiveFailures = 0; // 성공 시 카운터 리셋
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [${board.id}] 실패: ${msg}`);
      failedBoards.push(board.id);
      perBoardCount[board.id] = 0;
      consecutiveFailures++;

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error("");
        console.error("🛑 403/429 등 연속 실패 3회 감지 — 전체 중단");
        console.error("   9가드 8번: 차단 시그널. 시간을 두고 재시도하거나 카페 정책 확인 필요.");
        break;
      }
    }
  }

  // ─────────────── 요약 ───────────────
  const total = Object.values(perBoardCount).reduce((a, b) => a + b, 0);
  const perBoardSummary = Object.entries(perBoardCount)
    .map(([id, n]) => `${id} ${n}`)
    .join(", ");

  console.log("========================================");
  console.log("[DRY RUN] Phase 1 요약");
  console.log("========================================");
  console.log(`총 ${total}건 수집 (${perBoardSummary})`);
  if (failedBoards.length > 0) {
    console.log(`실패 게시판: ${failedBoards.join(", ")}`);
  }
  console.log("");
  console.log("💡 DB 쓰기 0 (Phase 1은 dry-run 전용).");
  console.log("   P1.4 검증 기준: 10건 모두 dataid+제목+작성자 추출 / 한글 깨짐 없음 /");
  console.log("                   시간 파싱 정확 / 평균 응답 < 3초 / 차단 시그널 없음");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
