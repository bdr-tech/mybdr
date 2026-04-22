/**
 * 다음카페 일반 게시판 4종(N54V/IVd2/E7hL/bWL) 대규모 이전 스크립트.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 9가드 체크리스트 (backfill 범위)
 * ──────────────────────────────────────────────────────────────────────────────
 *   [x] 1. 요청 간격 3초 유지       — fetchBoardList / fetchArticle 내부 sleep + 페이지 간 sleep
 *   [x] 2. 새벽 1~6시 회피          — 수동 실행. cron 호출 금지
 *   [x] 3. 수빈 본인 계정 쿠키만    — DAUM_CAFE_COOKIE / storageState 공통
 *   [x] 4. 본문 UI 요약만           — 마스킹 후 DB 저장, 로그는 300자 요약
 *   [x] 5. 전화/계좌 마스킹         — upsertCommunityPostFromCafe 내부 2차 가드
 *   [x] 6. 삭제 요청 프로세스       — Phase 3 관리 UI
 *   [x] 7. 일반 모바일 UA 유지      — fetcher/article-fetcher 공용
 *   [x] 8. 403/429 3회 연속 중단    — 이 스크립트가 카운터 관리
 *   [x] 9. 공식 요청 즉시 중단      — 운영 별도 대응
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * 사용법:
 *   # dry-run (기본) — 목록 수집 + 미리보기만, DB 쓰기 0
 *   npx tsx --env-file=.env --env-file=.env.local \
 *     scripts/backfill-cafe-community.ts --board=E7hL --max-pages=3
 *
 *   # 본문 포함 dry-run
 *   npx tsx --env-file=.env --env-file=.env.local \
 *     scripts/backfill-cafe-community.ts --board=E7hL --max-pages=3 --with-body --article-limit=5
 *
 *   # 실제 DB 쓰기 (승인 후 + bot user 사전 생성 필수)
 *   npx tsx --env-file=.env --env-file=.env.local \
 *     scripts/backfill-cafe-community.ts --board=E7hL --max-pages=20 --with-body --article-limit=20 --execute
 *
 *   # 목록만 빠르게 규모 파악 (본문 fetch 없음)
 *   npx tsx --env-file=.env --env-file=.env.local \
 *     scripts/backfill-cafe-community.ts --board=bWL --max-pages=20 --list-only
 *
 * 옵션:
 *   --board=E7hL|bWL|N54V|IVd2|community   (community = 4게시판 전부)
 *   --max-pages=N            기본 5, 상한 20 (페이지당 20건 * 20 = 400건/게시판)
 *   --article-limit=N        기본 10, 상한 100 (본문 fetch 건수). IVd2 전량(95건) 등 100건 이내 작은 게시판 1회 처리용으로 확대
 *   --offset=N               기본 0, 상한 400 (목록 앞쪽 N건 건너뜀). 대규모 게시판 전량 이전 시 100건씩 분할 처리용. 예: 1차 --article-limit=100, 2차 --offset=100 --article-limit=100 ...
 *   --posted-since=YYYY-MM-DD   해당 날짜(KST) 이후 게시글만 대상 (긴급 백필 모드). 예: --posted-since=2026-04-15 → 2026-04-15 00:00 KST 포함 이후. postedAt 없는 글(시분 미제공 등)은 필터 활성 시 자동 제외.
 *   --posted-until=YYYY-MM-DD   해당 날짜(KST) 까지 게시글만 대상. end-inclusive (다음날 00:00 미포함). --posted-since 와 조합 가능.
 *   --with-body              본문 fetch + upsert 실행 (기본 꺼짐)
 *   --list-only              목록만 (본문 스킵)
 *   --execute                실제 DB 쓰기 (dry-run 해제)
 *   --debug                  디버그 HTML/JSON 덤프
 *
 * 안전장치:
 *   - 운영 DB 가드 2중 (본 스크립트 + upsert.ts 내부)
 *   - dry-run 기본
 *   - 카페 봇 유저 존재 검증 (upsert.ts 의 resolveCafeBotUserId 가 throw)
 *   - 403/429 연속 3회 중단
 *   - board.target=community_posts 외 게시판 거부
 */

import { PrismaClient } from "@prisma/client";
import {
  CAFE_BOARDS,
  CafeBoard,
  getBoardById,
  getBoardsByTarget,
} from "../src/lib/cafe-sync/board-map";
import { fetchBoardList, fetchBoardListApi, BoardItem, sleep } from "../src/lib/cafe-sync/fetcher";
import { fetchArticle } from "../src/lib/cafe-sync/article-fetcher";
import { maskPersonalInfo } from "../src/lib/security/mask-personal-info";
import {
  upsertCommunityPostFromCafe,
  previewCommunityUpsert,
  resolveCafeBotUserId,
  type CafeCommunityInput,
  type CommunityUpsertResult,
} from "../src/lib/cafe-sync/upsert";

// ─────────────────────────────────────────────────────────────────────────────
// 인자 파싱
// ─────────────────────────────────────────────────────────────────────────────

const EXECUTE_MODE = process.argv.includes("--execute");
const WITH_BODY = process.argv.includes("--with-body");
const LIST_ONLY = process.argv.includes("--list-only");
const DEBUG = process.argv.includes("--debug");

const DEV_DB_IDENTIFIER = "bwoorsgoijvlgutkrcvs";
const MAX_CONSECUTIVE_FAILURES = 3;
const PAGE_GAP_MS = 3000; // 페이지 간 9가드
const API_PAGE_SIZE = 20; // 안정 상한 (실측 50 가능하지만 20으로 여유)

function parseNumArg(flag: string, defaultVal: number, min: number, max: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  if (!arg) return defaultVal;
  const n = Number(arg.split("=")[1]);
  if (!Number.isFinite(n) || n < min || n > max) {
    console.error(`⚠️ --${flag} 범위 위반 (${min}~${max}): ${arg}`);
    process.exit(1);
  }
  return Math.floor(n);
}

/**
 * [2026-04-22] 긴급 백필 모드 — KST 기준 YYYY-MM-DD 파싱.
 * 옵션 미지정 시 null 반환(필터 비활성).
 * 잘못된 포맷은 process.exit(1).
 */
function parseDateArg(flag: string): Date | null {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  if (!arg) return null;
  const raw = arg.split("=")[1];
  // KST(UTC+9) 기준 해석 — 사용자 직관과 일치
  const d = new Date(`${raw}T00:00:00+09:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(d.getTime())) {
    console.error(`⚠️ --${flag} 포맷 오류 (YYYY-MM-DD 필수, KST 해석): ${raw}`);
    process.exit(1);
  }
  return d;
}

/** Date 객체를 KST YYYY-MM-DD 로 포맷 (로그 출력용 — 사용자 입력과 일치) */
function dateToKstYmd(d: Date): string {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function parseBoardsArg(): CafeBoard[] {
  const arg = process.argv.find((a) => a.startsWith("--board="));
  if (!arg) {
    console.error(
      `⚠️ --board 필수. 예: --board=E7hL | --board=bWL | --board=community (4게시판 전부)`,
    );
    process.exit(1);
  }
  const val = arg.split("=")[1];
  if (val === "community") return getBoardsByTarget("community_posts");
  const b = getBoardById(val);
  if (!b) {
    console.error(
      `⚠️ 알 수 없는 게시판 id: "${val}". ` +
        `허용값: N54V | IVd2 | E7hL | bWL | community`,
    );
    process.exit(1);
  }
  if (b.target !== "community_posts") {
    console.error(
      `⚠️ 이 스크립트는 community_posts 타겟 게시판 전용. ` +
        `"${val}"은 target=${b.target}. games 타겟은 sync-cafe.ts 이용.`,
    );
    process.exit(1);
  }
  return [b];
}

// ─────────────────────────────────────────────────────────────────────────────
// 운영 DB 가드
// ─────────────────────────────────────────────────────────────────────────────

function assertDevDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes(DEV_DB_IDENTIFIER)) {
    console.error(
      `🛑 운영 DB 가드: DATABASE_URL 이 개발 DB 가 아닙니다.\n` +
        `   식별자 "${DEV_DB_IDENTIFIER}" 필수.`,
    );
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const maxPages = parseNumArg("max-pages", 5, 1, 20);
  const articleLimit = parseNumArg("article-limit", 10, 1, 100);
  const articleOffset = parseNumArg("offset", 0, 0, 400);
  const postedSince = parseDateArg("posted-since");
  const postedUntil = parseDateArg("posted-until");
  // until end-inclusive: 다음날 00:00 KST 미포함 처리
  const postedUntilExclusive = postedUntil
    ? new Date(postedUntil.getTime() + 24 * 60 * 60 * 1000)
    : null;
  const boards = parseBoardsArg();

  console.log("========================================");
  console.log(
    `[${EXECUTE_MODE ? "EXECUTE" : "DRY RUN"}] 카페 community backfill` +
      (WITH_BODY ? " (본문 포함)" : LIST_ONLY ? " (목록만)" : " (미리보기)"),
  );
  console.log("========================================");
  console.log(
    `대상: ${boards.map((b) => `${b.id}(${b.label})`).join(", ")} / ` +
      `max-pages=${maxPages} / article-limit=${articleLimit}` +
      (articleOffset > 0 ? ` / offset=${articleOffset}` : "") +
      (postedSince ? ` / since=${dateToKstYmd(postedSince)}` : "") +
      (postedUntil ? ` / until=${dateToKstYmd(postedUntil)}` : ""),
  );
  console.log("");

  if (EXECUTE_MODE || WITH_BODY) {
    assertDevDatabase();
    console.log(`✓ 개발 DB 식별자 확인 (${DEV_DB_IDENTIFIER})`);
  }

  const prisma = EXECUTE_MODE ? new PrismaClient() : null;

  // 봇 유저 사전 로드 (EXECUTE 모드만, 없으면 throw 로 중단)
  if (EXECUTE_MODE && prisma) {
    const botId = await resolveCafeBotUserId(prisma);
    console.log(`✓ 카페 봇 유저 확인 (user_id=${botId})`);
    console.log("");
  }

  // 전체 집계
  let totalListed = 0;
  let totalBodyFetched = 0;
  const perBoardSummary: Record<
    string,
    { listed: number; bodyFetched: number; results: CommunityUpsertResult[] }
  > = {};

  try {
    for (const board of boards) {
      console.log(`━━━ [${board.id} ${board.label}] backfill 시작 ━━━`);
      perBoardSummary[board.id] = { listed: 0, bodyFetched: 0, results: [] };

      // ─── 1단계: 페이지 순회로 목록 수집 ───
      const items: BoardItem[] = [];
      const seenDataids = new Set<string>();
      let consecutiveFailures = 0;
      let cursor: string | undefined;

      for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
        try {
          let pageItems: BoardItem[];
          if (pageNo === 1) {
            // 1페이지: HTML SSR
            pageItems = await fetchBoardList(board, API_PAGE_SIZE, { debug: DEBUG });
          } else {
            if (!cursor) {
              console.log(`  [${board.id}] page=${pageNo}: cursor 없음 — 중단`);
              break;
            }
            pageItems = await fetchBoardListApi(board, cursor, pageNo, API_PAGE_SIZE, {
              debug: DEBUG,
            });
          }

          if (pageItems.length === 0) {
            console.log(`  [${board.id}] page=${pageNo}: 빈 응답 — 마지막 페이지 도달`);
            break;
          }

          // 중복 dataid 탐지 (동일 페이지 반복 패턴 방지)
          let newCount = 0;
          for (const it of pageItems) {
            if (!seenDataids.has(it.dataid)) {
              seenDataids.add(it.dataid);
              items.push(it);
              newCount++;
            }
          }

          if (newCount === 0) {
            console.log(`  [${board.id}] page=${pageNo}: 전부 중복 dataid — 중단`);
            break;
          }

          cursor = pageItems[pageItems.length - 1]?.bbsDepth;
          console.log(
            `  [${board.id}] page=${pageNo}: +${newCount}건 (누적 ${items.length}건, ` +
              `첫 dataid=${pageItems[0].dataid}, 마지막 dataid=${pageItems[pageItems.length - 1].dataid})`,
          );

          consecutiveFailures = 0;
          // 페이지 간 3초 sleep (9가드)
          if (pageNo < maxPages) await sleep(PAGE_GAP_MS);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  [${board.id}] page=${pageNo}: 실패 — ${msg}`);
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.error("🛑 페이지 수집 연속 실패 3회 — 게시판 중단");
            break;
          }
          await sleep(PAGE_GAP_MS);
        }
      }

      perBoardSummary[board.id].listed = items.length;
      totalListed += items.length;

      // 목록 샘플 출력 (상위 5건)
      if (items.length > 0) {
        console.log("");
        console.log(`  [${board.id}] 목록 상위 5건 샘플:`);
        items.slice(0, 5).forEach((it, i) => {
          const posted = it.postedAt ? it.postedAt.toISOString().slice(0, 16) : "-";
          console.log(
            `    ${i + 1}. [dataid=${it.dataid}] ${it.title.slice(0, 50)} ` +
              `(author=${it.author || "-"}, posted=${posted})`,
          );
        });
      }

      // ─── 2단계: 본문 fetch + upsert ───
      if (LIST_ONLY) {
        console.log(`  [${board.id}] --list-only 모드 — 본문 fetch 스킵`);
        console.log("");
        continue;
      }
      if (!WITH_BODY) {
        console.log(`  [${board.id}] --with-body 없음 — 본문 fetch 스킵`);
        console.log("");
        continue;
      }

      // [2026-04-22] 긴급 백필 모드 — posted-since/until 활성 시 시간 필터 우선 적용.
      // postedAt null 인 글(시분 미제공)은 범위 불확실 → 필터 활성 시 제외.
      let filtered = items;
      if (postedSince || postedUntilExclusive) {
        const before = filtered.length;
        filtered = filtered.filter((it) => {
          if (!it.postedAt) return false;
          if (postedSince && it.postedAt < postedSince) return false;
          if (postedUntilExclusive && it.postedAt >= postedUntilExclusive) return false;
          return true;
        });
        console.log(
          `  [${board.id}] 시간 필터: ${filtered.length}/${before}건 통과 ` +
            `(since=${postedSince ? dateToKstYmd(postedSince) : "∞"}, ` +
            `until=${postedUntil ? dateToKstYmd(postedUntil) : "∞"})`,
        );
      }

      const targetItems = filtered.slice(articleOffset, articleOffset + articleLimit);
      console.log("");
      console.log(
        `  [${board.id}] 본문 fetch ${targetItems.length}건 시작` +
          (articleOffset > 0 ? ` (offset=${articleOffset} 건너뜀)` : ""),
      );

      let bodyFailures = 0;
      for (let i = 0; i < targetItems.length; i++) {
        const it = targetItems[i];
        try {
          const r = await fetchArticle(board, it.dataid, {
            debug: DEBUG,
            skipGameParse: true, // community 는 경기 파싱 불필요
          });

          if (!r.content) {
            console.log(`    [${i + 1}] dataid=${r.dataid} — 본문 추출 실패, 스킵`);
            continue;
          }

          perBoardSummary[board.id].bodyFetched++;
          totalBodyFetched++;

          const maskedContent = maskPersonalInfo(r.content);
          const communityInput: CafeCommunityInput = {
            board,
            dataid: r.dataid,
            dataidNum: it.dataidNum,
            title: it.title,
            author: it.author,
            content: maskedContent,
            postedAt: r.postedAt ?? it.postedAt,
            crawledAt: new Date(),
          };

          if (EXECUTE_MODE && prisma) {
            const res = await upsertCommunityPostFromCafe(prisma, communityInput);
            perBoardSummary[board.id].results.push(res);
            if (res.action === "failed") {
              console.log(`    [${i + 1}] ❌ ${res.error}`);
            } else {
              console.log(
                `    [${i + 1}] ✅ ${res.action} (postId=${res.postId}) — "${it.title.slice(0, 40)}"`,
              );
            }
          } else {
            const preview = previewCommunityUpsert(communityInput);
            console.log(
              `    [${i + 1}] 🔍 category=${preview.category} / author=${preview.authorNickname} / ` +
                `source=${preview.cafeSourceId} / willInsert=${preview.willInsert}`,
            );
          }

          bodyFailures = 0;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`    [${i + 1}] ❌ 본문 실패: ${msg}`);
          bodyFailures++;
          if (bodyFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.error("🛑 본문 fetch 연속 실패 3회 — 게시판 중단");
            break;
          }
        }
      }

      console.log("");
    }

    // ─── 전체 요약 ───
    console.log("========================================");
    console.log("backfill 요약");
    console.log("========================================");
    console.log(`총 목록 수집: ${totalListed}건`);
    console.log(`총 본문 fetch: ${totalBodyFetched}건`);
    console.log("");

    for (const [boardId, sum] of Object.entries(perBoardSummary)) {
      const created = sum.results.filter((r) => r.action === "created").length;
      const skipped = sum.results.filter((r) => r.action === "skipped_duplicate").length;
      const failed = sum.results.filter((r) => r.action === "failed").length;
      console.log(
        `  ${boardId}: listed=${sum.listed} / body=${sum.bodyFetched} / ` +
          `created=${created} / skipped(dup)=${skipped} / failed=${failed}`,
      );
    }

    console.log("");
    if (!EXECUTE_MODE) {
      console.log(`💡 dry-run 완료. 실제 DB 쓰기: --execute 플래그 추가`);
    } else {
      console.log(`✅ execute 완료.`);
    }
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("💥 실행 에러:", err);
  process.exit(1);
});
