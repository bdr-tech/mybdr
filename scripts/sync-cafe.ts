/**
 * 다음카페 3개 게시판 동기화 실행기 (Phase 1 목록 + Phase 2a 본문 + Phase 2b DB 쓰기).
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 9가드 체크리스트 (Phase 1 + 2a + 2b 범위)
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
 *                                                                    # 목록 3 + 본문 2 파싱 (dry-run)
 *   npx tsx --env-file=.env.local scripts/sync-cafe.ts --board=IVHA --limit=5 --with-body --execute
 *                                                                    # Phase 2b — 실제 DB 쓰기
 *
 * Phase 2b 동작:
 *   - --execute **없으면** dry-run (DB 쓰기 0, upsert 미리보기만 출력)
 *   - --execute **있으면** 실제 cafe_posts + games upsert
 *   - 운영 DB 가드 2중 (본 스크립트 + upsert.ts). 개발 DB 식별자 미포함 시 abort.
 *   - 20건+ 처리 시 4초 카운트다운 (Ctrl+C 기회).
 */

import { CAFE_BOARDS, CafeBoard, getBoardById } from "../src/lib/cafe-sync/board-map";
import { fetchBoardList, BoardItem } from "../src/lib/cafe-sync/fetcher";
import { fetchArticle, ArticleFetchResult } from "../src/lib/cafe-sync/article-fetcher";
import { maskPersonalInfo } from "../src/lib/security/mask-personal-info";
import {
  upsertCafeSyncedGame,
  previewUpsert,
  type CafeSyncInput,
  type CafeSyncResult,
} from "../src/lib/cafe-sync/upsert";

// ─────────────────────────────────────────────────────────────────────────────
// 실행 모드 판정 — --execute 여부로 DB 쓰기 활성화
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Phase 2b부터 --execute 허용. 없으면 종전처럼 dry-run (DB 쓰기 0).
 *
 * 중요:
 *   이 플래그가 true라도 upsert.ts 내부 가드에서 한 번 더 검증한다(2중 방어).
 */
const EXECUTE_MODE = process.argv.includes("--execute");

// 운영 DB 가드 — 개발 DB 식별자가 DATABASE_URL에 포함되어야 --execute 허용.
// 같은 상수를 upsert.ts에도 두어 2중 가드를 이룬다 (DRY보다 안전성 우선).
const DEV_DB_IDENTIFIER = "bwoorsgoijvlgutkrcvs";

if (EXECUTE_MODE) {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes(DEV_DB_IDENTIFIER)) {
    console.error(
      `🛑 운영 DB 가드(sync-cafe.ts): DATABASE_URL이 개발 DB가 아닙니다.\n` +
        `   개발 DB 식별자 "${DEV_DB_IDENTIFIER}"를 포함해야 --execute 실행 가능합니다.\n` +
        `   실수로 운영 DB가 들어간 .env를 사용하지 않는지 확인하세요.`,
    );
    process.exit(1);
  }
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
  // 참고: upsert 경로(main) 에서는 syncInput.content 에 이미 마스킹된 값을 넣는다.
  // 이 printArticleResult 는 article-fetcher 결과(r.content 원본)만 받는 시그니처라 여기서 1회 마스킹.
  // 멱등이라 이중 호출돼도 결과 동일.
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

/**
 * 20건+ 실행 시 4초 카운트다운 (Ctrl+C 기회).
 *
 * 왜 20건 기준:
 *   - 10건 미만은 IVHA 샘플링 수준 (부담 적음)
 *   - 20건부터는 3게시판 통합 스캔에 근접 → 실수 방지용 안전망
 *   - 4초면 손이 느려도 Ctrl+C 가능
 */
async function countdown(seconds: number, totalPosts: number): Promise<void> {
  console.log(
    `⚠️  Phase 2b --execute: 총 ${totalPosts}건을 개발 DB에 upsert 합니다. ` +
      `Ctrl+C로 중단 가능. ${seconds}초 후 시작…`,
  );
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r   ${i}초…  `);
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write("\r   시작!   \n\n");
}

async function main() {
  const targets = parseBoardArg();
  const limit = parseLimitArg();
  // --debug 플래그: fetcher에 전달하여 응답 HTML 덤프 + 진단 정보 출력 활성화.
  const debug = process.argv.includes("--debug");
  // --with-body: Phase 2a 본문 fetch + 파싱. --execute와 조합하면 Phase 2b DB 쓰기.
  const withBody = process.argv.includes("--with-body");
  const articleLimit = parseArticleLimitArg();

  // Phase 2b — --execute 시에만 Prisma 생성 (dry-run은 DB 접근 0 유지)
  // 동적 import: upsert.ts는 import만 해도 OK (가드는 upsertCafeSyncedGame 호출 시 검증)
  // 하지만 prisma 인스턴스는 실제 연결을 시도하므로 --execute일 때만 생성한다.
  const needPrisma = EXECUTE_MODE && withBody;
  const { PrismaClient } = needPrisma ? await import("@prisma/client") : { PrismaClient: null };
  const prisma = PrismaClient ? new PrismaClient() : null;

  const modeLabel = EXECUTE_MODE ? "[EXECUTE]" : "[DRY RUN]";
  const phaseLabel = withBody
    ? EXECUTE_MODE
      ? "다음카페 Phase 2b (목록+본문+DB 쓰기)"
      : "다음카페 Phase 2a (목록+본문)"
    : "다음카페 Phase 1 POC (목록)";

  console.log("========================================");
  console.log(`${modeLabel} ${phaseLabel}`);
  console.log("========================================");
  console.log(
    `대상 게시판: ${targets.map((b) => `${b.id}(${b.label})`).join(", ")} / limit=${limit}` +
      (withBody ? ` / with-body=ON / article-limit=${articleLimit}` : "") +
      (debug ? " / debug=ON" : "") +
      (EXECUTE_MODE ? " / execute=ON" : ""),
  );
  console.log("");

  // 20건+ 경고 카운트다운 (--execute만)
  if (EXECUTE_MODE && withBody) {
    const estimatedTotal = targets.length * Math.min(articleLimit, limit);
    if (estimatedTotal >= 20) {
      await countdown(4, estimatedTotal);
    }
  }

  // 집계
  const perBoardCount: Record<string, number> = {};
  const failedBoards: string[] = [];

  // Phase 2a 집계
  const articleResults: ArticleFetchResult[] = [];
  const articleHttpByStatus: Record<string, number> = {};
  const articleFailures: { boardId: string; dataid: string; error: string }[] = [];
  // Phase 2b 집계 — upsert 처리 결과
  const upsertResults: CafeSyncResult[] = [];

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

        // ─── Phase 2b: upsert 미리보기 / 실행 ───
        // 본문 추출 성공(content 있음)일 때만 upsert 의미가 있음. content 빈 경우 스킵.
        if (withBody && r.content) {
          // ⚠️ 개인정보 마스킹 — 9가드 #5 핵심 포인트.
          //   이전 버그: 로그용 변수(masked)만 마스킹하고 upsert 인자는 r.content 원본을 넘겨
          //   DB 의 cafe_posts.content / games.description 에 평문 전화·계좌가 들어갔다.
          //   수정: "변수 자체"를 한 번 마스킹하고 아래 console.log·upsert 에 동일 값 사용.
          //   maskPersonalInfo 는 멱등(idempotent) 이므로 upsert.ts 의 2차 가드와 중복돼도 안전.
          const maskedContent = maskPersonalInfo(r.content);

          const syncInput: CafeSyncInput = {
            board,
            dataid: r.dataid,
            // [2026-04-20] 정렬 tie-break 용 Int 복제본.
            //   BoardItem.dataidNum 은 fetcher 에서 이미 NaN 가드 통과 → 유한 정수 보장.
            //   article-fetcher 의 r.dataid(string) 은 BoardItem.dataid 와 동일 값이라
            //   it.dataidNum 을 그대로 신뢰한다.
            dataidNum: it.dataidNum,
            title: it.title, // 목록에서 가져온 제목
            author: it.author,
            content: maskedContent, // ← 마스킹된 값으로 교체 (이전엔 r.content 원본 전달)
            // [2026-04-20] 상세 페이지 HTML에는 시분만 있어 extractPostedAt이 null 반환 가능.
            // BoardItem.postedAt(목록 articleElapsedTime 파싱, 날짜만 정확, 시분 00:00) fallback.
            // 시분까지 정확히 얻는 로직은 다음 세션(middle 단계)에서 보강.
            postedAt: r.postedAt ?? it.postedAt,
            crawledAt: new Date(),
            parsed: r.parsed,
          };

          if (EXECUTE_MODE && prisma) {
            // 실제 DB 쓰기
            const res = await upsertCafeSyncedGame(prisma, syncInput);
            upsertResults.push(res);
            if (res.error) {
              console.log(`      ❌ upsert 실패: ${res.error}`);
            } else {
              console.log(
                `      ✅ upsert: cafe_post=${res.cafePost} (id=${res.cafePostId}), game=${res.game}` +
                  (res.gameId ? ` (id=${res.gameId})` : ""),
              );
            }
          } else {
            // dry-run 미리보기 — DB 접근 0
            // Phase 2b Step 4 — 각 필드 옆에 (parsed/extracted/fallback) 소스를 괄호로 노출.
            //   왜: "값이 DB 에 어떻게 들어갈지"뿐 아니라 "어떤 추출 경로로 나왔는지"를
            //   스모크 테스트에서 한 눈에 보기 위함. 운영 투입 전 검증 효율↑.
            const preview = previewUpsert(syncInput);
            console.log(
              `      🔍 upsert 예정: game_id=${preview.gameId} / ` +
                `game_type=${preview.gameType} / ` +
                `scheduled_at=${preview.scheduledAt} (${preview.scheduledAtSource}) / ` +
                `game insert=${preview.willInsertGame ? "YES" : "NO (parsed 없음)"}`,
            );
            console.log(
              `         fields: fee=${preview.fee}원(${preview.feeSource}) / ` +
                `max=${preview.maxParticipants}명(${preview.maxParticipantsSource}) / ` +
                `skill=${preview.skillLevel}(${preview.skillLevelSource}) / ` +
                `city=${preview.city ?? "null"}(${preview.citySource}) / ` +
                `district=${preview.district ?? "null"}(${preview.districtSource}) / ` +
                `venue=${preview.venueName ?? "null"}(${preview.venueNameSource})`,
            );
          }
        }

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

  // ─────────────── Phase 2b upsert 집계 ───────────────
  if (withBody && EXECUTE_MODE) {
    const postCreated = upsertResults.filter((r) => r.cafePost === "created" && r.error === undefined).length;
    const postFailed = upsertResults.filter((r) => r.cafePost === "failed").length;
    const gameInserted = upsertResults.filter((r) => r.game === "inserted").length;
    const gameSkippedDup = upsertResults.filter((r) => r.game === "skipped_duplicate").length;
    const gameSkippedNoParse = upsertResults.filter((r) => r.game === "skipped_no_parse").length;
    const gameFailed = upsertResults.filter((r) => r.game === "failed").length;

    console.log("");
    console.log("── Phase 2b upsert 집계 ──");
    console.log(
      `  cafe_posts: ${upsertResults.length}건 처리 / created(+updated)=${postCreated} / failed=${postFailed}`,
    );
    console.log(
      `  games: inserted=${gameInserted} / skipped(dup)=${gameSkippedDup} / ` +
        `skipped(no-parse)=${gameSkippedNoParse} / failed=${gameFailed}`,
    );

    const failedDetails = upsertResults.filter((r) => r.error);
    if (failedDetails.length > 0) {
      console.log("");
      console.log("── upsert 실패 상세 ──");
      failedDetails.forEach((r, i) => {
        console.log(`  [${i + 1}] cafePostId=${r.cafePostId ?? "-"}, error=${r.error}`);
      });
    }
  }

  console.log("");
  if (withBody && EXECUTE_MODE) {
    console.log("✅ Phase 2b 실행 완료. 운영 DB 가드 통과 + upsert 집계는 위 참조.");
  } else {
    console.log("💡 DB 쓰기 0 (--execute 미지정 → dry-run).");
    if (withBody) {
      console.log(
        "   실제 DB 쓰기: `--execute` 추가 + `--env-file=.env.local`로 개발 DB 명시 (upsert.ts 가드 통과 필수).",
      );
    }
  }

  // Prisma 연결 해제 (생성했을 때만)
  if (prisma) {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
