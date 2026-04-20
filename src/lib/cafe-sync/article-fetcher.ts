/**
 * 다음카페 모바일 본문 상세 HTML fetch + 본문 영역 추출 + parseCafeGame 호출 (Phase 2a).
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 9가드 체크리스트 (Phase 2a 범위)
 * ──────────────────────────────────────────────────────────────────────────────
 *   [x] 1. 요청 간격 3초 유지       — sleep(MIN_REQUEST_INTERVAL_MS)
 *   [x] 2. 새벽 1~6시 회피          — 수동 실행, Phase 3 cron에서 강제
 *   [x] 3. 본인 쿠키 (DAUM_CAFE_COOKIE) — 없으면 경고만 찍고 시도 (403 예상)
 *   [x] 4. 본문은 DB 저장만, UI 요약 — Phase 2b upsert에서 적용. 여기선 콘솔 출력만
 *   [x] 5. 개인정보 마스킹          — 소비자(sync-cafe.ts)가 maskPersonalInfo 적용
 *   [x] 6. 삭제 요청 프로세스       — Phase 3 admin UI
 *   [x] 7. 일반 모바일 UA           — USER_AGENT 상수
 *   [x] 8. 403/429 명확 에러        — status별 throw 메시지 분리
 *   [x] 9. 공식 요청 즉시 중단      — 운영 별도 대응
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * 왜 이 모듈이 필요한가:
 *   Phase 1에서 목록(dataid + 제목)만 수집. Phase 2a는 본문을 가져와서
 *   parseCafeGame()이 venue/scheduled_at/fee 등을 얼마나 잘 뽑는지 **검증**한다.
 *   DB 쓰기는 Phase 2b로 유보 (여기서 prisma import 금지).
 *
 * 본문 추출 전략 (우선순위):
 *   1) JS 변수 `content: "..."` / `articleContent = "..."` 정규식 스캔
 *      — 다음카페 모바일은 SSR 초기 데이터에 본문을 담아두는 패턴이 흔함
 *   2) DOM 본문 영역 cheerio — 여러 셀렉터 fallback
 *      (.article_boxer, .article_view, #articleView, .boxer_view, [data-article-content])
 *   3) script JSON-LD `articleBody`
 *
 *   모두 실패 시 content="" + parseError="본문 영역 미발견" 세팅.
 *   호출자는 --debug로 tmp/cafe-debug-article-*.html 저장 파일을 분석해서
 *   실제 셀렉터를 보정할 수 있다 (Phase 2a 중점 작업).
 */

import * as cheerio from "cheerio";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { articleUrl, listUrl, type CafeBoard } from "./board-map";
// fetcher.ts에서 export된 sleep / parseCafeDate 재사용 (코드 중복 방지)
import { sleep, parseCafeDate } from "./fetcher";
import { parseCafeGame, type ParsedCafeGame, type ParseStats } from "@/lib/parsers/cafe-game-parser";

// ─────────────────────────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────────────────────────

/** 일반 모바일 Safari UA. 9가드 7번 (봇 UA 금지) */
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

/** 단일 요청 타임아웃 (ms) */
const REQUEST_TIMEOUT_MS = 10_000;

/** 요청 간 최소 대기 (ms). 9가드 1번 */
const MIN_REQUEST_INTERVAL_MS = 3_000;

// ─────────────────────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────────────────────

/** 본문 추출 방식 — 디버그 리포트용 */
export type ExtractMethod = "js_variable" | "dom_selector" | "json_ld" | "none";

export interface ArticleFetchResult {
  /** 게시글 dataid */
  dataid: string;
  /** 요청한 URL */
  url: string;
  /** HTTP 상태 코드 (예외가 아닌 경우만; throw 시에는 이 결과가 반환되지 않음) */
  httpStatus: number;
  /** 응답 HTML 원본 크기 (bytes) */
  htmlSize: number;
  /** 추출된 본문 텍스트 원본 (마스킹 전). 미추출 시 빈 문자열 */
  content: string;
  /** 본문 추출에 사용된 방법 */
  extractMethod: ExtractMethod;
  /** 작성 시각 (HTML에서 추출 성공 시). 실패 시 null */
  postedAt: Date | null;
  /** parseCafeGame 결과. content 미추출 시 null */
  parsed: ParsedCafeGame | null;
  /** parseCafeGame stats. content 미추출 시 null */
  parseStats: ParseStats | null;
  /** 파싱 단계 실패 사유. 성공 시 null */
  parseError: string | null;
  /** --debug 시 저장된 HTML 덤프 경로 */
  rawHtmlPath?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 쿠키 로드 유틸 (Playwright storageState → Cookie 헤더)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Playwright storageState JSON → Cookie 헤더 문자열 변환.
 *
 * 왜:
 *   수동으로 `document.cookie` 또는 Application 탭에서 쿠키를 복사할 때
 *   HttpOnly 쿠키(TIARA/DID 등 다음 로그인 핵심)가 빠지는 문제가 반복 발생.
 *   Playwright storageState는 브라우저의 **완전한 쿠키 세트**(HttpOnly 포함)를
 *   내보내므로 이 방식이 영구 해결책.
 *
 * storageState 구조 (Playwright 표준):
 *   { cookies: [{ name, value, domain, path, httpOnly, ... }, ...], origins: [...] }
 *
 * m.cafe.daum.net 접근에 필요한 쿠키 필터:
 *   - domain이 ".daum.net"로 끝남 (TIARA, DID 등 전역 쿠키 포함)
 *   - 또는 m.cafe.daum.net / cafe.daum.net / logins.daum.net 정확 매칭
 *
 * 실패(파일 없음/파싱 실패/해당 쿠키 없음) 시 null 반환 → 호출자가 env fallback.
 */
function loadCookiesFromStorageState(statePath: string): string | null {
  if (!existsSync(statePath)) return null;
  try {
    const raw = readFileSync(statePath, "utf8");
    const state = JSON.parse(raw) as {
      cookies?: Array<{ name: string; value: string; domain: string }>;
    };
    if (!state.cookies || !Array.isArray(state.cookies)) return null;

    const relevant = state.cookies.filter((c) => {
      const d = c.domain;
      return (
        d.endsWith(".daum.net") ||
        d === "m.cafe.daum.net" ||
        d === "cafe.daum.net" ||
        d === "logins.daum.net"
      );
    });
    if (relevant.length === 0) return null;
    return relevant.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  storageState 파싱 실패 (${statePath}): ${msg}`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 본문 추출 유틸
// ─────────────────────────────────────────────────────────────────────────────

/**
 * JS 문자열 리터럴의 이스케이프 시퀀스를 디코드 (fetcher.ts와 동일 로직).
 * fetcher.ts의 decodeEscapes는 non-export라 여기에 중복 선언한다.
 * (fetcher.ts 수정 금지 규칙에 따라 export 추가 대신 복제)
 */
function decodeJsStringEscapes(s: string): string {
  return s
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * HTML 엔티티 기본 디코드 (&nbsp; &amp; &lt; &gt; &quot; &#숫자;).
 * 다음카페 본문은 엔티티로 인코딩되어 들어오는 경우가 많다 (`&#52573;` → `촉`).
 */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * HTML 태그 제거 + 연속 공백/개행 정리.
 * cheerio .text()는 개행을 모두 지워버려 parseCafeGame의 "1. HOME 팀명\n2. 일시" 라인 구분이
 * 망가진다. 그래서 <br>, <p>, <div> 종료 태그를 개행으로 바꾼 뒤 나머지 태그를 제거한다.
 *
 * Phase 2b 품질 보강: script/style/noscript 태그는 **내용까지 통째로** 제거.
 * 왜 최우선: 다음카페 본문에 Tistory ImageGrid 같은 IIFE(`(function () { ... })()`)가
 * 남아 있으면 그 내용이 텍스트로 본문에 섞여 들어와 UI/description 에 자바스크립트
 * 코드가 그대로 노출됨 (id=397 스킬존3관 실측).
 */
function stripHtmlPreservingLines(html: string): string {
  return (
    html
      // ⚠️ 순서 중요: 태그 제거 전에 script/style/noscript 블록을 내용째로 먼저 삭제.
      //   그렇지 않으면 .replace(/<[^>]+>/g, "") 가 태그만 벗겨 내용이 텍스트로 남음.
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style\s*>/gi, "")
      .replace(/<noscript\b[\s\S]*?<\/noscript\s*>/gi, "")
      // 블록 경계를 개행으로 보존
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      // 나머지 태그 제거
      .replace(/<[^>]+>/g, "")
      // 태그 제거 후 남을 수 있는 IIFE 잔재 (`(function () { ... })();` 또는 `})();`)
      // Tistory ImageGrid 스크립트가 HTML 엔티티 인코딩된 상태로 JS 변수 안에 들어 있는 경우
      // 태그 없이 코드 문자열로만 존재 → 위 script 태그 제거가 못 잡으므로 추가 방어.
      .replace(/\(function\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\)\s*\([^)]*\)\s*;?/g, "")
      // 엔티티 디코드
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
      // 연속 공백/개행 정리 (라인 구분은 유지)
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim()
  );
}

/**
 * JS 변수 기반 본문 추출.
 *
 * 다음카페 모바일 SSR HTML 안에 다음 패턴 중 하나가 들어있을 가능성:
 *   - `article.content = "본문..."`
 *   - `var articleContent = "본문..."`
 *   - `content: "본문..."` (articles.push 같은 리터럴 블록, 목록 fetcher 패턴의 상세 버전)
 *   - `articleContent: "본문..."`
 *
 * 여러 정규식을 순차 시도하고 **가장 긴 매칭**을 채택 (본문이 가장 길 가능성 높음).
 */
function extractContentFromJsVariables(html: string): string | null {
  const candidates: string[] = [];

  // 패턴 1: article.content = "..."  또는  article["content"] = "..."
  const p1 = /article\s*(?:\.\s*content|\[\s*["']content["']\s*\])\s*=\s*"((?:[^"\\]|\\.)*)"/g;
  // 패턴 2: var|let|const articleContent = "..."
  const p2 = /(?:var|let|const)\s+articleContent\s*=\s*"((?:[^"\\]|\\.)*)"/g;
  // 패턴 3: 객체 리터럴 안의 content: "..." (길이 50자 이상 = 본문 확률)
  const p3 = /content\s*:\s*"((?:[^"\\]|\\.){50,})"/g;
  // 패턴 4: articleContent: "..." (객체 프로퍼티 형식)
  const p4 = /articleContent\s*:\s*"((?:[^"\\]|\\.)*)"/g;

  for (const re of [p1, p2, p3, p4]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const decoded = decodeJsStringEscapes(m[1]);
      // HTML 엔티티/태그 섞여 있을 수 있으므로 후처리
      const cleaned = stripHtmlPreservingLines(decoded);
      if (cleaned.length >= 20) {
        candidates.push(cleaned);
      }
    }
  }

  if (candidates.length === 0) return null;
  // 가장 긴 후보 채택 (본문은 일반적으로 가장 긴 문자열)
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

/**
 * DOM 본문 영역 cheerio 추출 (여러 셀렉터 fallback).
 *
 * 다음카페 모바일의 본문 영역은 확정된 셀렉터가 없어서 여러 후보를 순차 시도한다.
 * Phase 2a 실행 후 실제 HTML을 보고 정확한 셀렉터를 보정한다.
 */
function extractContentFromDom($: cheerio.CheerioAPI): string | null {
  const selectors = [
    ".article_boxer",
    ".article_view",
    "#articleView",
    ".boxer_view",
    "[data-article-content]",
    "#article",
    ".article",
    ".content_view",
    ".cont_detail",
    "#user_contents",
  ];

  for (const sel of selectors) {
    const $el = $(sel).first();
    if ($el.length === 0) continue;
    const rawHtml = $.html($el) ?? "";
    const cleaned = stripHtmlPreservingLines(rawHtml);
    if (cleaned.length >= 20) {
      return cleaned;
    }
  }

  return null;
}

/**
 * JSON-LD articleBody 추출 (3순위 fallback).
 */
function extractContentFromJsonLd($: cheerio.CheerioAPI): string | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    const raw = $(scripts[i]).html();
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw) as unknown;
      // articleBody 필드가 있으면 채택. 배열이면 첫 요소만.
      const body = extractArticleBody(obj);
      if (body && body.length >= 20) return stripHtmlPreservingLines(body);
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }
  return null;
}

/** JSON-LD 객체 트리에서 articleBody 찾기 (재귀 얕은 탐색) */
function extractArticleBody(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = extractArticleBody(item);
      if (r) return r;
    }
    return null;
  }
  const rec = obj as Record<string, unknown>;
  if (typeof rec.articleBody === "string") return rec.articleBody;
  // @graph 형태 지원
  if (rec["@graph"]) return extractArticleBody(rec["@graph"]);
  return null;
}

/**
 * 작성 시각 추출.
 * HTML 안의 `articleElapsedTime: "..."` 또는 JSON-LD `datePublished`.
 */
function extractPostedAt(html: string, $: cheerio.CheerioAPI, now: Date): Date | null {
  // 1) JS 변수: articleElapsedTime: "26.04.18"
  const m1 = /articleElapsedTime\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(html);
  if (m1) {
    const dt = parseCafeDate(decodeJsStringEscapes(m1[1]), now);
    if (dt) return dt;
  }
  // 2) JS 변수: regDttm / createdAt ("2026-04-18 10:30:00" 등)
  const m2 = /(?:regDttm|createdAt)\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(html);
  if (m2) {
    const raw = decodeJsStringEscapes(m2[1]);
    // "YYYY-MM-DD HH:MM:SS" 형태는 parseCafeDate가 일부 지원
    const dt = parseCafeDate(raw.slice(0, 16), now);
    if (dt) return dt;
  }
  // 3) JSON-LD datePublished
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    const raw = $(scripts[i]).html();
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw) as unknown;
      const pub = extractDatePublished(obj);
      if (pub) {
        const dt = new Date(pub);
        if (!Number.isNaN(dt.getTime())) return dt;
      }
    } catch {
      // ignore
    }
  }
  // 4) [2026-04-20 추가] DOM: <span class="num_subject"> (다음카페 상세의 유일한 시간 소스)
  //    실측(tmp/cafe-debug-article-IVHA-{3919,3920,3923,3924,3925}.html) 결과:
  //      - 당일 글: "HH:MM" (예: "13:40")
  //      - 과거 글: "YY.MM.DD" (예: "26.04.17")
  //    1~3번 소스(articleElapsedTime/regDttm/JSON-LD)는 상세 HTML에 존재하지 않음 →
  //    이 4번 fallback이 실질적 유일 소스. parseCafeDate가 두 형식 모두 지원.
  const numSubjectText = $("span.num_subject").first().text().trim();
  if (numSubjectText) {
    const dt = parseCafeDate(numSubjectText, now);
    if (dt) return dt;
  }
  return null;
}

function extractDatePublished(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = extractDatePublished(item);
      if (r) return r;
    }
    return null;
  }
  const rec = obj as Record<string, unknown>;
  if (typeof rec.datePublished === "string") return rec.datePublished;
  if (rec["@graph"]) return extractDatePublished(rec["@graph"]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 핵심: fetchArticle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 다음카페 모바일 게시글 상세 HTML을 가져와서 본문 추출 + parseCafeGame 호출.
 *
 * 동작:
 *   1) 호출 직후 3초 sleep (9가드 1번)
 *   2) fetch (UA + Cookie + AbortController timeout)
 *   3) status별 에러 분류 (401/403/404/429/5xx)
 *   4) 본문 추출 (JS 변수 → DOM → JSON-LD 순서)
 *   5) 작성 시각 추출
 *   6) parseCafeGame(content, postedAt ?? now) 호출
 *   7) --debug 시 HTML 덤프 + 콘솔 리포트
 *
 * 이 함수는 **throw 하는 경우**:
 *   - 네트워크 오류 / timeout
 *   - HTTP 200 외 응답 (호출자가 연속 실패 카운터 관리)
 *
 * 이 함수는 **정상 반환**:
 *   - HTTP 200이면 본문 추출 실패여도 result(parseError 세팅) 반환.
 *     호출자가 "파싱 실패" 집계 가능.
 */
export async function fetchArticle(
  board: CafeBoard,
  dataid: string,
  options: { debug?: boolean; sleepMs?: number } = {},
): Promise<ArticleFetchResult> {
  // 9가드 1번 — 3초 대기
  const sleepMs = options.sleepMs ?? MIN_REQUEST_INTERVAL_MS;
  await sleep(sleepMs);

  const url = articleUrl(board, dataid);

  // 쿠키 로드 — 값 자체는 로그에 남기지 않음 (보안)
  //
  // 우선순위:
  //   1. .auth/cafe-state.json (Playwright storageState, HttpOnly 포함) ← 권장
  //   2. DAUM_CAFE_COOKIE env var (레거시 수동 추출, HttpOnly 누락 가능)
  //
  // 경로 override: DAUM_CAFE_STORAGE_STATE env var
  const stateDefaultPath = resolve(process.cwd(), ".auth", "cafe-state.json");
  const stateOverridePath = process.env.DAUM_CAFE_STORAGE_STATE;
  const statePath = stateOverridePath ?? stateDefaultPath;

  let cookie = loadCookiesFromStorageState(statePath);
  let cookieSource: "storageState" | "env" | "none" = "storageState";

  if (!cookie) {
    cookie = process.env.DAUM_CAFE_COOKIE ?? "";
    cookieSource = cookie ? "env" : "none";
  }

  if (!cookie) {
    console.warn(
      `⚠️  쿠키 없음 — .auth/cafe-state.json 또는 DAUM_CAFE_COOKIE 중 하나 필요. ` +
        `cafe-login.ts 실행으로 storageState 생성 권장 (board=${board.id}, dataid=${dataid})`,
    );
  } else if (options.debug) {
    // 값 자체는 절대 로그 금지. 길이와 소스만 표시.
    console.log(`  cookie source  : ${cookieSource} (${cookie.length}자)`);
  }

  // AbortController로 10초 timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // 왜 Referer를 추가하나:
  //   상세 페이지는 쿠키만으로는 403이 날 수 있다. 브라우저가 실제로 목록에서 클릭해
  //   들어온 흔적(Referer)이 있을 때만 허용하는 봇 차단 패턴 존재.
  //   게시판 목록 URL을 Referer로 실어서 자연스러운 내비게이션을 흉내낸다.
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    "Referer": listUrl(board),
  };
  if (cookie) headers["Cookie"] = cookie;

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
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[${board.id}/${dataid}] fetch 실패: ${msg}`);
  }
  clearTimeout(timer);

  // status별 명확 에러 메시지 (9가드 8번)
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `[${board.id}/${dataid}] HTTP ${res.status} — 쿠키 만료 또는 권한 없음 (DAUM_CAFE_COOKIE 갱신 필요)`,
      );
    }
    if (res.status === 404) {
      throw new Error(`[${board.id}/${dataid}] HTTP 404 — 글 삭제됨 가능성`);
    }
    if (res.status === 429) {
      throw new Error(`[${board.id}/${dataid}] HTTP 429 — Rate limit 감지 (9가드 8번 중단 트리거)`);
    }
    if (res.status >= 500) {
      throw new Error(`[${board.id}/${dataid}] HTTP ${res.status} — 카페 서버 오류`);
    }
    throw new Error(`[${board.id}/${dataid}] HTTP ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const htmlSize = Buffer.byteLength(html, "utf8");

  // ───────── 본문 추출 (우선순위) ─────────
  const $ = cheerio.load(html);
  let content: string | null = null;
  let extractMethod: ExtractMethod = "none";

  content = extractContentFromJsVariables(html);
  if (content) {
    extractMethod = "js_variable";
  } else {
    content = extractContentFromDom($);
    if (content) {
      extractMethod = "dom_selector";
    } else {
      content = extractContentFromJsonLd($);
      if (content) extractMethod = "json_ld";
    }
  }

  const now = new Date();
  const postedAt = extractPostedAt(html, $, now);

  // ───────── parseCafeGame ─────────
  let parsed: ParsedCafeGame | null = null;
  let parseStats: ParseStats | null = null;
  let parseError: string | null = null;

  if (!content) {
    parseError = "본문 영역 미발견 (JS 변수 / DOM / JSON-LD 모두 실패)";
  } else {
    try {
      // parseCafeGame 시그니처: (content, referenceDate?)
      // referenceDate는 scheduledAt 연/월 보정용. postedAt 없으면 now로 fallback.
      const result = parseCafeGame(content, postedAt ?? now);
      parsed = result.data;
      parseStats = result.stats;
      // 모든 필드가 비었고 matchedLines=0이면 파싱 실패로 간주
      if (parseStats.matchedLines === 0) {
        parseError = "parseCafeGame: 라벨 라인 매칭 0건 (본문 양식 불일치)";
      }
    } catch (err) {
      parseError = `parseCafeGame throw: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // ───────── 디버그 덤프 ─────────
  let rawHtmlPath: string | undefined;
  if (options.debug) {
    const tmpDir = resolve(process.cwd(), "tmp");
    try {
      mkdirSync(tmpDir, { recursive: true });
    } catch {
      // 이미 존재
    }
    rawHtmlPath = resolve(tmpDir, `cafe-debug-article-${board.id}-${dataid}.html`);
    writeFileSync(rawHtmlPath, html, "utf8");

    console.log("──────────────────────────────────────────────");
    console.log(`[DEBUG ${board.id}/${dataid}] 본문 진단`);
    console.log("──────────────────────────────────────────────");
    console.log(`  HTTP status    : ${res.status} ${res.statusText}`);
    console.log(`  응답 크기      : ${htmlSize} bytes`);
    console.log(`  쿠키 감지      : ${cookie ? `O (${cookie.length}자)` : "X"}`);
    console.log(`  추출 방식      : ${extractMethod}`);
    console.log(`  본문 길이      : ${content?.length ?? 0}자`);
    console.log(`  postedAt       : ${postedAt ? postedAt.toISOString() : "null"}`);
    console.log(`  matchedLines   : ${parseStats?.matchedLines ?? 0} / ${parseStats?.totalLines ?? 0}`);
    console.log(`  parseError     : ${parseError ?? "-"}`);
    console.log(`  덤프 파일      : ${rawHtmlPath}`);
    console.log("──────────────────────────────────────────────");
  }

  // 엔티티 디코드는 본문 추출 함수들 안에서 이미 적용됨
  void decodeHtmlEntities;

  return {
    dataid,
    url,
    httpStatus: res.status,
    htmlSize,
    content: content ?? "",
    extractMethod,
    postedAt,
    parsed,
    parseStats,
    parseError,
    rawHtmlPath,
  };
}
