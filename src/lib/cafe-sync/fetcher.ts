/**
 * 다음카페 모바일 게시판 목록 HTML → BoardItem[] 파서 (Phase 1 POC).
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 9가드 체크리스트 (Phase 1 범위)
 * ──────────────────────────────────────────────────────────────────────────────
 *   [x] 1. 요청 간격 3초 유지       — fetchBoardList 호출 전 await sleep(3000)
 *   [x] 2. 새벽 1~6시 회피          — 수동 실행이라 사용자 책임. (Phase 3 cron에서 강제)
 *   [x] 3. 수빈 본인 계정 쿠키만    — Phase 1은 쿠키 불필요 (공개 목록)
 *   [x] 4. 본문 UI 요약만           — Phase 1은 UI 무관 (목록 제목만 취급)
 *   [x] 5. 전화/계좌 마스킹         — Phase 1은 본문 fetch 안 함
 *   [x] 6. 삭제 요청 프로세스       — Phase 3 관리 UI에서 처리
 *   [x] 7. 일반 모바일 UA 유지      — UA 상수 (iPhone 17.0 Safari)
 *   [x] 8. 403/429 3회 연속 중단    — 호출자(sync-cafe.ts)가 카운터 관리
 *   [x] 9. 공식 요청 즉시 중단      — 운영 중 별도 대응
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * 파싱 전략 (2026-04-19 전환):
 *   다음카페 모바일은 "빈 UL + <script> 초기 데이터" 분리형 SSR.
 *   - `<ul class="list_cafe after_articles">`는 비어있고,
 *   - `<script>` 블록 안 `var articles = []; articles.push({ dataid:..., title:... });`에
 *     실제 게시글 데이터가 이미 들어있다.
 *   - 클라이언트 JS(initGeneralArticles)가 이 배열을 DOM으로 렌더링.
 *
 *   → cheerio DOM 셀렉팅이 아니라, HTML 문자열에서 정규식으로
 *     `articles.push({...})` 블록을 추출하고 필드별 regex로 값만 뽑는다.
 *   → Playwright/XHR 역공학 불필요.
 */

// cheerio는 디버그 섹션의 .list_cafe 공지 덤프용으로만 유지.
// Phase 2 본문 파싱에서도 쓸 가능성이 있어 의존성 제거는 보류.
import * as cheerio from "cheerio";
// 디버그 모드에서 응답 HTML을 파일로 저장하기 위함. 옵션 활성화 시에만 I/O 발생.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { CafeBoard, listUrl } from "./board-map";

// ─────────────────────────────────────────────────────────────────────────────
// 쿠키 감지 로그 (모듈 로드 시 1회)
// ─────────────────────────────────────────────────────────────────────────────
// 왜: Phase 1 0건 수집 원인이 "로그인 비필수 게시판인데 비로그인 응답은 목록 숨김"일 수 있음.
// .env.local에 DAUM_CAFE_COOKIE를 세팅했는지 여부를 모듈 초기화 시점에 1회만 확인한다.
// 보안: 쿠키 값 자체는 절대 로그에 남기지 않고, 길이(length)만 출력한다.
const COOKIE_PRELOADED = process.env.DAUM_CAFE_COOKIE ?? "";
if (!COOKIE_PRELOADED) {
  console.warn("⚠️  DAUM_CAFE_COOKIE 미설정 — 로그인 쿠키 없이 요청 (목록 누락 가능성)");
} else {
  console.log(`✓ DAUM_CAFE_COOKIE 감지 (${COOKIE_PRELOADED.length}자)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────────────────────────

/** 일반 모바일 Safari UA. 9가드 7번 (봇 UA 금지) */
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

/** 단일 요청 타임아웃 (ms). 다음카페 응답은 보통 1~2초 */
const REQUEST_TIMEOUT_MS = 10_000;

/** 요청 간 최소 대기 (ms). 9가드 1번 */
const MIN_REQUEST_INTERVAL_MS = 3_000;

/**
 * `articles.push({...});` 블록을 통째로 뽑는 정규식.
 *
 * - 각 블록은 한 줄이 아니라 여러 줄에 걸친 객체 리터럴이라 `[\s\S]*?` (lazy)로 매칭.
 * - 중첩 `{ }`는 실제 데이터에 나타나지 않음 (관찰된 샘플 기준). 나타나도 필드별 정규식에서
 *   잘못 걸릴 위험은 낮음 — 필드 이름이 명시적이기 때문.
 */
const ARTICLES_PUSH_RE = /articles\.push\(\{([\s\S]*?)\}\);/g;

// ─────────────────────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────────────────────

/** 목록 1행 파싱 결과 */
export interface BoardItem {
  /** 카페 글 고유 id (URL path 마지막 숫자) */
  dataid: string;
  /**
   * dataid 를 정수로 변환한 값.
   *
   * 왜 별도 필드:
   *   - 2026-04-20 정렬 tie-break 용도로 도입. `games.metadata.cafe_article_id`(Int) 에 저장해서
   *     같은 분(minute) 에 올라온 글을 카페 게시 순서대로 배열하기 위함.
   *   - dataid 는 단조 증가(실측 3926 ~ 3896 역순)이므로 숫자로 다루면 tie-break 키로 완벽.
   *   - string 원본도 유지하는 이유: URL/cafe_dataid 메타 등에서 문자열 형태로 재사용.
   *
   * 비숫자 dataid 는 fetcher 단계에서 스킵하므로 이 필드는 반드시 유한 정수를 담는다.
   */
  dataidNum: number;
  /** 글 제목 */
  title: string;
  /** 작성자 닉네임 */
  author: string;
  /** 작성 시각 (파싱 성공 시 Date, 실패 시 null) */
  postedAt: Date | null;
  /** 원본 목록 URL (디버깅용) */
  listUrl: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────────────────────

/** Promise sleep (9가드 1번: 요청 간 3초 유지) */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 한글 깨짐(mojibake) 간이 감지.
 *
 * 다음카페 모바일은 UTF-8이지만 프록시/중간 인코딩 오설정 시 문자가 깨질 수 있다.
 * "\uFFFD" (replacement char) 포함 또는 한글 블록이 전혀 없으면 이상 신호.
 *
 * Phase 1 진단용. true 반환 시 호출자가 로그만 찍고 진행.
 */
export function isGarbled(text: string): boolean {
  if (!text) return false;
  if (text.includes("\uFFFD")) return true;
  // 최소 길이가 있을 때만 한글 검사 (짧은 응답은 원래 한글 없을 수 있음)
  if (text.length > 500) {
    const hangulMatches = text.match(/[가-힣]/g);
    if (!hangulMatches || hangulMatches.length < 5) return true;
  }
  return false;
}

/**
 * JS 문자열 리터럴의 이스케이프 시퀀스를 디코드.
 *
 * 다음카페 HTML 안에 임베드된 `title: "..."` 문자열은 일반적인 JS 이스케이프를 사용한다.
 * 예: `\"`, `\\`, `\n`, `\uXXXX`.
 */
function decodeEscapes(s: string): string {
  return s
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * articles.push 블록 안에서 특정 필드 값을 추출.
 *
 * 지원 형식:
 *   - `fieldName: "문자열 값"` (이스케이프 포함)
 *   - `fieldName: 123`
 *   - `fieldName: Number("123")`  ← 다음카페 viewCount/commentCount가 이 형태
 *
 * 필드가 없거나 매칭 실패 시 null.
 */
function extractField(block: string, fieldName: string): string | null {
  // 문자열: fieldName: "값"  (값 안에 \" 이스케이프 허용)
  const strRe = new RegExp(`${fieldName}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const strMatch = block.match(strRe);
  if (strMatch) return decodeEscapes(strMatch[1]);

  // 숫자: fieldName: 123  또는  fieldName: Number("123")
  const numRe = new RegExp(`${fieldName}\\s*:\\s*(?:Number\\("(\\d+)"\\)|(\\d+))`);
  const numMatch = block.match(numRe);
  if (numMatch) return numMatch[1] ?? numMatch[2] ?? null;

  return null;
}

/**
 * 다음카페 특유의 작성시각 문자열 → Date.
 *
 * articleElapsedTime 관찰 케이스 (2026-04-19 샘플 기준):
 *   "26.04.18"           → YY.MM.DD, 올해~최근
 *   "2025.12.31"         → YYYY.MM.DD, 작년 이상
 *   "10:30"              → 오늘 HH:MM
 *   "방금 전" / "N분 전" / "N시간 전"  → relative (SSR에선 드물지만 대응)
 *   "MM-DD HH:MM"        → 연도 생략 (과거 레거시)
 *
 * 실패 시 null.
 *
 * KST 처리: YY.MM.DD / YYYY.MM.DD는 KST 자정(UTC+9 기준) 기준으로 UTC 환산.
 */
export function parseCafeDate(raw: string, now: Date = new Date()): Date | null {
  if (!raw) return null;
  const s = raw.trim();

  // 1) "방금 전"
  if (/방금/.test(s)) return new Date(now);

  // 2) "N분 전"
  const minAgoMatch = /^(\d{1,3})\s*분\s*전$/.exec(s);
  if (minAgoMatch) {
    return new Date(now.getTime() - Number(minAgoMatch[1]) * 60_000);
  }

  // 3) "N시간 전"
  const hourAgoMatch = /^(\d{1,2})\s*시간\s*전$/.exec(s);
  if (hourAgoMatch) {
    return new Date(now.getTime() - Number(hourAgoMatch[1]) * 3_600_000);
  }

  // 4) "YY.MM.DD" (2자리 연도, 2000년대 가정) — 다음카페 기본 포맷
  const shortMatch = /^(\d{2})\.(\d{2})\.(\d{2})$/.exec(s);
  if (shortMatch) {
    const [, yy, mo, d] = shortMatch;
    const y = 2000 + Number(yy);
    const utcMs = Date.UTC(y, Number(mo) - 1, Number(d), 0 - 9, 0);
    const dt = new Date(utcMs);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // 5) "YYYY.MM.DD HH:MM" 또는 "YYYY-MM-DD HH:MM"
  const fullMatch = /^(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})\s+(\d{1,2}):(\d{2})$/.exec(s);
  if (fullMatch) {
    const [, y, mo, d, h, mi] = fullMatch;
    const utcMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h) - 9, Number(mi));
    const dt = new Date(utcMs);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // 6) "YYYY.MM.DD" / "YYYY-MM-DD" (시각 없음 → 00:00 KST)
  const dateOnlyMatch = /^(\d{4})[\.\-](\d{1,2})[\.\-](\d{1,2})$/.exec(s);
  if (dateOnlyMatch) {
    const [, y, mo, d] = dateOnlyMatch;
    const utcMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), 0 - 9, 0);
    const dt = new Date(utcMs);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // 7) "HH:MM" (오늘 시각 — 최근 작성분)
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (timeMatch) {
    const [, h, mi] = timeMatch;
    // now의 KST 날짜를 구해서 해당 HH:MM을 KST로 고정 → UTC 환산
    const kst = new Date(now.getTime() + 9 * 3_600_000);
    const y = kst.getUTCFullYear();
    const mo = kst.getUTCMonth();
    const d = kst.getUTCDate();
    const utcMs = Date.UTC(y, mo, d, Number(h) - 9, Number(mi));
    const dt = new Date(utcMs);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // 8) "MM-DD HH:MM" / "MM.DD HH:MM" (연도 없음 → now.year, 레거시)
  const mdHmMatch = /^(\d{1,2})[\.\-](\d{1,2})\s+(\d{1,2}):(\d{2})$/.exec(s);
  if (mdHmMatch) {
    const [, mo, d, h, mi] = mdHmMatch;
    const y = now.getFullYear();
    const utcMs = Date.UTC(y, Number(mo) - 1, Number(d), Number(h) - 9, Number(mi));
    const dt = new Date(utcMs);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 핵심: fetchBoardList
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 게시판 목록을 최신순으로 N건 가져온다.
 *
 * 동작:
 *   1) 호출 직후 3초 sleep (9가드 1번 — 첫 호출도 간격 유지)
 *   2) fetch (UA 지정 + AbortController timeout)
 *   3) HTTP 403/429 포함 200 외 응답 → throw (호출자가 연속 실패 카운터 관리)
 *   4) response.text()
 *   5) HTML 문자열에서 `articles.push({...})` 블록을 regex로 전부 추출
 *   6) 각 블록에서 필드별 regex로 dataid/title/writerNickname/articleElapsedTime/fldid 추출
 *   7) fldid가 board.id와 다르면 스킵, 필수 필드(dataid/title) 없으면 스킵
 *   8) limit 만큼 slice
 *
 * @param board CAFE_BOARDS 엘리먼트
 * @param limit 최대 반환 개수 (기본 10)
 */
export async function fetchBoardList(
  board: CafeBoard,
  limit = 10,
  options: { debug?: boolean } = {},
): Promise<BoardItem[]> {
  // 9가드 1번 — 첫 호출도 3초 대기 (스크립트 초반 연속 호출 방지)
  await sleep(MIN_REQUEST_INTERVAL_MS);

  const url = listUrl(board);

  // AbortController로 10초 timeout 강제
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // 왜 헤더를 변수로 분리하나:
  //   쿠키가 있을 때만 Cookie 헤더를 추가해야 하기 때문. 조건부로 필드를 붙인다.
  const cookie = process.env.DAUM_CAFE_COOKIE ?? "";
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
  };
  if (cookie) {
    // 보안: 값 자체는 절대 로그에 남기지 않음. 요청에만 실음.
    headers["Cookie"] = cookie;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      redirect: "follow",
    });
  } catch (err) {
    clearTimeout(timer);
    // AbortError / 네트워크 오류 모두 throw
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[${board.id}] fetch 실패: ${msg}`);
  }
  clearTimeout(timer);

  if (!res.ok) {
    // 403/429 등 비정상 응답 → 호출자가 연속 실패 카운터 관리
    throw new Error(`[${board.id}] HTTP ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  // 한글 깨짐 감지 (로그만)
  if (isGarbled(html)) {
    console.warn(`[${board.id}] ⚠️ 한글 깨짐 의심 — 인코딩 확인 필요`);
  }

  // ────────────────────────────────────────────────────────────────────────
  // [2026-04-20] 공지 혼입 방어 가드 (실측 현재 수집 0건이지만 미래 레이아웃 변경 대비)
  //
  // 왜:
  //   - 실측(tmp/cafe-debug-IVHA.html)에서 공지는 `<div id="noticeContainer">`에만 존재하고
  //     articles.push 블록에는 일반글만 들어간다 → 현재 0건 혼입.
  //   - 다음카페 측이 HTML 레이아웃을 변경해 공지를 articles.push 에 섞는 경우를 대비해
  //     파싱 전에 noticeContainer 구간을 통째로 드롭한다.
  //   - lookahead `(?=<script[^>]*>\s*var\s+articles)` 로 articles 선언 직전까지만 삭제 →
  //     일반글 블록 오삭제 방지 (articles 선언이 항상 존재하므로 non-greedy 매칭 안전).
  //   - i 플래그: noticeContainer 대소문자 표기 변형 대비.
  //
  // 참조: scratchpad-cafe-sync.md "E-1. 공지글 수집 현황 (실측)" / "E-2. 필터 구현 방식"
  // ────────────────────────────────────────────────────────────────────────
  const cleanedHtml = html.replace(
    /<div\s+id=["']noticeContainer["'][\s\S]*?(?=<script[^>]*>\s*var\s+articles)/i,
    "",
  );

  // ────────────────────────────────────────────────────────────────────────
  // 핵심: articles.push({...}) 블록 모두 수집
  // ────────────────────────────────────────────────────────────────────────
  const blocks: string[] = [];
  // exec + while 루프로 global regex 모든 매칭 순회 (matchAll도 가능하나 타입 호환상 exec 사용)
  ARTICLES_PUSH_RE.lastIndex = 0; // 모듈 최상단 상수라 재사용 시 lastIndex 리셋 필수
  let m: RegExpExecArray | null;
  while ((m = ARTICLES_PUSH_RE.exec(cleanedHtml)) !== null) {
    blocks.push(m[1]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 디버그 모드: 응답 HTML을 파일로 저장 + 핵심 진단 정보 콘솔 출력.
  // 왜: Phase 1에서 0건 수집된 원인(셀렉터 불일치/로그인 필요/SPA) 진단용.
  // ─────────────────────────────────────────────────────────────────────────
  if (options.debug) {
    // 1) tmp/ 디렉토리 확보 후 HTML 저장
    const tmpDir = resolve(process.cwd(), "tmp");
    try {
      mkdirSync(tmpDir, { recursive: true });
    } catch {
      // 이미 존재하는 경우 무시
    }
    const dumpPath = resolve(tmpDir, `cafe-debug-${board.id}.html`);
    writeFileSync(dumpPath, html, "utf8");

    // 2) 응답 상태/크기/title 추출 (title은 cheerio로 간편 추출)
    const byteLen = Buffer.byteLength(html, "utf8");
    const $ = cheerio.load(html);
    const titleText = $("title").first().text().trim() || "(none)";

    // 3) 공지(.list_cafe) 주변 HTML 500자 — 공지 구조 참고용
    let listCafeDump = "";
    const $listCafe = $(".list_cafe").first();
    if ($listCafe.length > 0) {
      const around = $.html($listCafe) ?? "";
      listCafeDump = around.slice(0, 500);
    } else {
      listCafeDump = "(.list_cafe 없음)";
    }

    // 4) 로그인 힌트 감지
    const loginRequiredHit =
      /로그인이\s*필요|로그인\s*해주세요|로그인이\s*필요합니다|login\?/i.test(html);
    const ogTitleMatch = /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i.exec(html);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : "(none)";

    // 5) 첫 articles.push 블록 원문 500자
    const firstBlockRaw = blocks.length > 0 ? blocks[0].slice(0, 500) : "(매칭 0건)";

    // 6) 콘솔 출력
    console.log("──────────────────────────────────────────────");
    console.log(`[DEBUG ${board.id}] 응답 진단`);
    console.log("──────────────────────────────────────────────");
    console.log(`  HTTP status       : ${res.status} ${res.statusText}`);
    console.log(`  응답 크기         : ${byteLen} bytes`);
    console.log(`  <title>           : ${titleText}`);
    console.log(`  og:title          : ${ogTitle}`);
    console.log(`  쿠키 감지         : ${cookie ? `O (${cookie.length}자)` : "X"}`);
    console.log(`  articles 블록 수  : ${blocks.length}개`);
    console.log(`  로그인 힌트       : ${loginRequiredHit ? "O (로그인 요구 문자열 발견)" : "X"}`);
    console.log(`  덤프 파일         : ${dumpPath}`);
    console.log(`  첫 articles.push 블록 (500자):`);
    console.log(firstBlockRaw);
    console.log(`  .list_cafe 공지 HTML (500자):`);
    console.log(listCafeDump);
    console.log("──────────────────────────────────────────────");
  }

  // ────────────────────────────────────────────────────────────────────────
  // 블록 → BoardItem 변환
  // ────────────────────────────────────────────────────────────────────────
  const items: BoardItem[] = [];
  const now = new Date();

  for (const block of blocks) {
    if (items.length >= limit) break;

    // fldid가 명시된 경우 board.id와 일치하는지 확인 (다른 게시판 섞임 방어)
    const fldid = extractField(block, "fldid");
    if (fldid && fldid !== board.id) continue;

    const dataid = extractField(block, "dataid");
    const title = extractField(block, "title");
    const author = extractField(block, "writerNickname");
    const elapsed = extractField(block, "articleElapsedTime");

    // 필수 필드 없으면 스킵
    if (!dataid || !title) continue;

    // [2026-04-20] dataidNum NaN 가드 — 비숫자 dataid 는 아예 진입 차단.
    // 왜: dataid 는 실측 항상 숫자지만, 방어적으로 변환 실패 시 cafe_article_id 에 NaN 이
    //     들어가지 않도록 여기서 미리 걸러낸다. (tie-break 정렬 대상이므로 무효값은 배제)
    const dataidNum = Number(dataid);
    if (!Number.isFinite(dataidNum)) {
      console.warn(`[${board.id}] ⚠️ 비숫자 dataid 스킵 (dataid="${dataid}")`);
      continue;
    }

    items.push({
      dataid,
      dataidNum,
      title,
      author: author ?? "",
      postedAt: parseCafeDate(elapsed ?? "", now),
      listUrl: url,
    });
  }

  return items;
}
