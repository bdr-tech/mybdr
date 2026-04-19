/**
 * 다음카페 3개 게시판 동기화 실행기 (Phase 1 목록 + Phase 2a 본문 dry-run).
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 9가드 체크리스트 (Phase 1 + 2a 범위)
 * ──────────────────────────────────────────────────────────────────────────────
 *   [x] 1. 요청 간격 3초 유지       — fetchBoardList/fetchArticle 내 sleep(3000)
 *   [x] 2. 새벽 1~6시 회피          — 수동 실행. Phase 3 cron에서 강제
 *   [x] 3. 수빈 본인 계정 쿠키만    — DAUM_CAFE_COOKIE env (본문 필수)
 *   [x] 4. 본문 UI 요약만           — Phase 2a는 콘솔 300자 요약 + 마스킹
 *   [x] 5. 전화/계좌 마스킹         — maskPersonalInfo 적용
 *   [x] 6. 삭제 요청 프로세스       — Phase 3
 *   [x] 7. 일반 모바일 UA           — fetcher/article-fetcher에서 관리
 *   [x] 8. 403/429 3회 연속 중단    — 본 스크립트가 카운터 관리
 *   [x] 9. 공식 요청 즉시 중단      — 운영 별도 대응
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * 사용법:
 *   npx tsx scripts/sync-cafe.ts                                    # 목록만, 3개 게시판 각 10건
 *   npx tsx scripts/sync-cafe.ts --board=IVHA --limit=5             # IVHA 5건만
 *   npx tsx scripts/sync-cafe.ts --board=IVHA --limit=5 --debug     # 디버그 (응답 HTML 저장)
 *   npx tsx scripts/sync-cafe.ts --board=IVHA --limit=3 --with-body --article-limit=2
 *                                                                    # 목록 3 + 본문 2 파싱
 *
 * Phase 2a 원칙:
 *   - DB 쓰기 0 (prisma import 금지)
 *   - --execute 플래그 여전히 차단 (Phase 2b에서 해제)
 *   - 콘솔 출력만 (본문 앞 300자는 마스킹 후 표시)
 */

import { CAFE_BOARDS, CafeBoard, getBoardById } from "../src/lib/cafe-sync/board-map";
import { fetchBoardList, BoardItem } from "../src/lib/cafe-sync/fetcher";
import { fetchArticle, ArticleFetchResult } from "../src/lib/cafe-sync/article-fetcher";
import { maskPersonalInfo } from "../src/lib/security/mask-personal-info";

// ─────────────────────────────────────────────────────────────────────────────
// --execute 가드 (Phase 1은 dry-run 전용)
// ─────────────────────────────────────────────────────────────────────────────

if (process.argv.includes("--execute")) {
  console.error("⚠️ --execute는 Phase 2b 이후에 지원됩니다. Phase 2a는 dry-run 전용 (DB 쓰기 0).");
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

/**
 * --article-limit=N (기본 3).
 *
 * 왜 기본 3인가:
 *   본문 fetch는 목록보다 무거워서 부하 보호. Phase 2a는 샘플링만 필요.
 *   1~10 범위로 제한해서 의도치 않은 대량 요청 차단.
 */
function parseArticleLimitArg(): number {
  const arg = process.argv.find((a) => a.startsWith("--article-limit="));
  if (!arg) return 3;
  const n = Number(arg.split("=")[1]);
  if (!Number.isFinite(n) || n < 1 || n > 10) {
    console.error(`⚠️ --article-limit 값이 유효하지 않음 (1~10): "${arg}"`);
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
// Phase 2a: 본문 fetch + 파싱 결과 요약
// ─────────────────────────────────────────────────────────────────────────────

/**
 * gameType 숫자 → 라벨 (parseCafeGame 반환값 기준).
 *   0 = PICKUP, 1 = GUEST, 2 = PRACTICE, null = 분류 보류
 */
function gameTypeLabel(t: 0 | 1 | 2 | null | undefined): string {
  if (t === 0) return "PICKUP";
  if (t === 1) return "GUEST";
  if (t === 2) return "PRACTICE";
  return "?";
}

/** 본문 결과 한 줄 파싱 리포트 + 마스킹 적용 300자 샘플 출력 */
function printArticleResult(idx: number, r: ArticleFetchResult): void {
  console.log(`  [${idx}] dataid=${r.dataid}`);
  console.log(`      HTTP ${r.httpStatus} / ${r.htmlSize}B / 추출=${r.extractMethod} / 본문 ${r.content.length}자`);
  if (r.parseError) {
    console.log(`      ⚠️ parseError: ${r.parseError}`);
  }
  if (r.parsed) {
    const p = r.parsed;
    // 핵심 필드 한 줄 요약 — 필드별 성공/실패 시각화
    console.log(
      `      파싱: gameType=${gameTypeLabel(p.gameType)} ` +
        `/ venue=${p.venueName ?? "-"} ` +
        `/ scheduledAt=${p.scheduledAt ? p.scheduledAt.toISOString() : "-"} ` +
        `/ fee=${p.feePerPerson ?? "-"} ` +
        `/ guestCount=${p.guestCount ?? "-"} ` +
        `/ city=${p.city ?? "-"} / district=${p.district ?? "-"}`,
    );
    if (r.parseStats) {
      console.log(
        `      stats: matchedLines=${r.parseStats.matchedLines}/${r.parseStats.totalLines} ` +
          `labels=[${r.parseStats.labels.join(", ")}]`,
      );
    }
  }
  // 본문 앞 300자 — **마스킹 적용** (9가드 #5)
  if (r.content) {
    const masked = maskPersonalInfo(r.content).slice(0, 300).replace(/\n/g, " ⏎ ");
    console.log(`      본문(마스킹): ${masked}${r.content.length > 300 ? "..." : ""}`);
  }
}

/**
 * 필드별 성공률 집계용 헬퍼.
 * 대상 필드가 undefined/null/빈값이면 실패로 카운트.
 */
function isFieldFilled(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.length > 0;
  if (typeof v === "number") return Number.isFinite(v);
  if (v instanceof Date) return !Number.isNaN(v.getTime());
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const targets = parseBoardArg();
  const limit = parseLimitArg();
  // --debug 플래그: fetcher에 전달하여 응답 HTML 덤프 + 진단 정보 출력 활성화.
  const debug = process.argv.includes("--debug");
  // --with-body: Phase 2a 본문 fetch + 파싱 (DB 쓰기 0)
  const withBody = process.argv.includes("--with-body");
  const articleLimit = parseArticleLimitArg();

  console.log("========================================");
  console.log(
    withBody ? "[DRY RUN] 다음카페 Phase 2a (목록+본문)" : "[DRY RUN] 다음카페 Phase 1 POC (목록)",
  );
  console.log("========================================");
  console.log(
    `대상 게시판: ${targets.map((b) => `${b.id}(${b.label})`).join(", ")} / limit=${limit}` +
      (withBody ? ` / with-body=ON / article-limit=${articleLimit}` : "") +
      (debug ? " / debug=ON" : ""),
  );
  console.log("");

  // 집계
  const perBoardCount: Record<string, number> = {};
  const failedBoards: string[] = [];

  // Phase 2a 집계
  const articleResults: ArticleFetchResult[] = [];
  const articleHttpByStatus: Record<string, number> = {};
  const articleFailures: { boardId: string; dataid: string; error: string }[] = [];

  // 9가드 8번 — 403/429 3회 연속 시 전체 중단
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 3;

  for (const board of targets) {
    // ─── 목록 fetch ───
    let items: BoardItem[] = [];
    try {
      items = await fetchBoardList(board, limit, { debug });
      printBoardResult(board, items);
      console.log(""); // 게시판 간 구분 빈 줄
      perBoardCount[board.id] = items.length;
      consecutiveFailures = 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [${board.id}] 목록 실패: ${msg}`);
      failedBoards.push(board.id);
      perBoardCount[board.id] = 0;
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error("🛑 403/429 등 연속 실패 3회 감지 — 전체 중단");
        break;
      }
      continue; // 목록 실패한 게시판은 본문 fetch 스킵
    }

    // ─── Phase 2a: 본문 fetch ───
    if (!withBody || items.length === 0) continue;

    // 최근 articleLimit 건만 본문 조회 (목록은 최신순)
    const targetItems = items.slice(0, articleLimit);
    console.log(`[${board.id}] 본문 fetch ${targetItems.length}건 시작 (--with-body)`);

    for (let i = 0; i < targetItems.length; i++) {
      const it = targetItems[i];
      try {
        const r = await fetchArticle(board, it.dataid, { debug });
        articleResults.push(r);
        // HTTP status 집계
        const key = String(r.httpStatus);
        articleHttpByStatus[key] = (articleHttpByStatus[key] ?? 0) + 1;
        printArticleResult(i + 1, r);
        consecutiveFailures = 0;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [${i + 1}] ❌ 본문 실패: ${msg}`);
        articleFailures.push({ boardId: board.id, dataid: it.dataid, error: msg });
        // status code 뽑아서 집계 (메시지 안에 "HTTP 403" 형식)
        const statusMatch = /HTTP\s+(\d+)/.exec(msg);
        const key = statusMatch ? statusMatch[1] : "error";
        articleHttpByStatus[key] = (articleHttpByStatus[key] ?? 0) + 1;
        consecutiveFailures++;
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.error("🛑 본문 fetch 연속 실패 3회 — 전체 중단");
          break;
        }
      }
    }
    console.log(""); // 게시판 간 구분
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) break;
  }

  // ─────────────── 요약 ───────────────
  const total = Object.values(perBoardCount).reduce((a, b) => a + b, 0);
  const perBoardSummary = Object.entries(perBoardCount)
    .map(([id, n]) => `${id} ${n}`)
    .join(", ");

  console.log("========================================");
  console.log(withBody ? "[DRY RUN] Phase 2a 요약" : "[DRY RUN] Phase 1 요약");
  console.log("========================================");
  console.log(`목록: 총 ${total}건 수집 (${perBoardSummary})`);
  if (failedBoards.length > 0) {
    console.log(`실패 게시판: ${failedBoards.join(", ")}`);
  }

  if (withBody) {
    const attempted = articleResults.length + articleFailures.length;
    const parsed = articleResults.filter((r) => r.parsed && !r.parseError).length;

    console.log("");
    console.log("── 본문 fetch 집계 ──");
    console.log(`  시도: ${attempted}건 / 성공: ${articleResults.length} / 실패: ${articleFailures.length}`);
    console.log(`  HTTP status별: ${JSON.stringify(articleHttpByStatus)}`);
    console.log(`  parseCafeGame 성공: ${parsed}/${articleResults.length}`);

    // 필드별 성공률 (본문 fetch 성공분 대상)
    if (articleResults.length > 0) {
      const fields: Array<[string, (p: NonNullable<ArticleFetchResult["parsed"]>) => unknown]> = [
        ["venueName", (p) => p.venueName],
        ["scheduledAt", (p) => p.scheduledAt],
        ["feePerPerson", (p) => p.feePerPerson],
        ["guestCount", (p) => p.guestCount],
        ["gameType", (p) => p.gameType],
        ["city", (p) => p.city],
        ["district", (p) => p.district],
      ];
      const total2 = articleResults.length;
      console.log(`  필드별 성공률 (n=${total2}):`);
      for (const [name, get] of fields) {
        const ok = articleResults.filter((r) => r.parsed && isFieldFilled(get(r.parsed))).length;
        const pct = total2 > 0 ? Math.round((ok / total2) * 100) : 0;
        console.log(`    ${name.padEnd(15)} ${ok}/${total2} (${pct}%)`);
      }

      // 평균 본문 크기
      const avgSize = Math.round(
        articleResults.reduce((acc, r) => acc + r.content.length, 0) / total2,
      );
      console.log(`  본문 평균 길이: ${avgSize}자`);
    }

    if (articleFailures.length > 0) {
      console.log("");
      console.log("── 본문 실패 상세 ──");
      articleFailures.forEach((f) => {
        console.log(`  [${f.boardId}/${f.dataid}] ${f.error}`);
      });
    }
  }

  console.log("");
  console.log("💡 DB 쓰기 0 (Phase 2a는 dry-run 전용).");
  if (withBody) {
    console.log("   다음 단계 (Phase 2b): upsert + --execute 활성화 + 역방향 백필 (경고 프로토콜)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
