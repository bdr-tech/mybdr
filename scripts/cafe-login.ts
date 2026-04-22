/**
 * 다음카페 Playwright 로그인 헬퍼.
 *
 * [왜]
 *   수동으로 DevTools에서 쿠키를 복사할 때 HttpOnly 쿠키(TIARA/DID 등 다음
 *   로그인 핵심)가 계속 누락되는 문제가 반복 발생. 이 스크립트는 실제 브라우저
 *   창을 띄워 사용자가 직접 로그인하게 하고, Playwright의 storageState 기능으로
 *   **모든 쿠키**(HttpOnly 포함)를 파일에 저장한다. 이후 article-fetcher가
 *   이 파일을 읽어 Cookie 헤더를 구성한다.
 *
 * [방법]
 *   1. Chromium 창 headed 모드로 열기 (m.cafe.daum.net/dongarry/IVHA)
 *   2. 사용자: 다음 로그인 → IVHA 게시판 글 하나 클릭해 본문이 보이는지 확인
 *   3. 터미널로 돌아와 [Enter]
 *   4. context.storageState({ path }) → .auth/cafe-state.json 저장
 *   5. 브라우저 자동 종료
 *
 * [사용]
 *   npx tsx scripts/cafe-login.ts
 *
 * [재실행]
 *   세션 쿠키 만료 시 스크립트 재실행 = 세션 갱신 (파일 덮어쓰기).
 *
 * [보안]
 *   - 저장 파일 `.auth/cafe-state.json`은 **민감 정보**(세션 쿠키)
 *   - .gitignore에 추가되어 있어야 함 (이 작업에서 추가)
 *   - 유출 시 즉시 다음 로그아웃 → 재로그인 → 본 스크립트 재실행
 */

import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const LOGIN_URL = "https://m.cafe.daum.net/dongarry/IVHA";

// article-fetcher.ts와 동일한 모바일 UA 사용 — 세션 일관성 확보
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

async function main() {
  const authDir = resolve(process.cwd(), ".auth");
  mkdirSync(authDir, { recursive: true });
  const statePath = resolve(authDir, "cafe-state.json");

  // headed 모드 — 사용자가 직접 로그인 인터랙션
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 }, // iPhone XR 근접 (모바일 웹)
    userAgent: USER_AGENT,
  });
  const page = await context.newPage();

  const bar = "=".repeat(60);
  console.log(bar);
  console.log("다음카페 로그인 세션 생성 (Playwright)");
  console.log(bar);
  console.log("⭐ 1) 열린 브라우저에서 다음 로그인");
  console.log("      → *** '로그인 상태 유지' 체크박스 반드시 클릭 *** ");
  console.log("         (체크 안 하면 쿠키가 ~1일 만료. 체크하면 30일+ 유지)");
  console.log("   2) IVHA 게시판에서 글 하나 클릭 → 본문이 보이는지 확인");
  console.log("   3) 터미널로 돌아와 [Enter]");
  console.log(bar);

  try {
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  } catch (err) {
    // 네트워크 느릴 때도 페이지는 로드 중일 수 있음 — 경고만
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  초기 페이지 이동 경고 (계속 진행): ${msg}`);
  }

  // [2026-04-22] "로그인 상태 유지" 체크박스 자동 클릭 시도 (best-effort)
  // 실제 다음 모바일 로그인 폼의 selector 가 여러 변형 있을 수 있어 여러 개 순회.
  // 실패해도 안내 메시지로 유저가 수동 체크 가능 → graceful.
  (async () => {
    const candidates = [
      'input[name="keepsignin"]',
      'input[name="saveSignIn"]',
      'input[name="stayLogin"]',
      'input[id="keepsignin"]',
      'input[id*="keep" i]',
      'input[type="checkbox"][name*="keep" i]',
      'input[type="checkbox"][name*="save" i]',
    ];
    for (let attempt = 0; attempt < 3; attempt++) {
      // 폼이 동적으로 뜰 수 있어 최대 3회 재시도 (각 2초 대기)
      for (const sel of candidates) {
        try {
          const el = await page.waitForSelector(sel, { timeout: 500, state: "attached" });
          if (el) {
            await el.check({ timeout: 500 }).catch(() => {});
            console.log(`✅ "로그인 상태 유지" 자동 체크 시도됨 (selector=${sel})`);
            return;
          }
        } catch {
          // 다음 selector / 다음 attempt
        }
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    // 전부 실패해도 조용히 끝 — 유저가 수동 체크하면 됨
  })().catch(() => {});

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question("로그인 + 본문 확인 완료 후 [Enter] ");
  rl.close();

  // storageState 저장 — cookies(HttpOnly 포함) + localStorage/sessionStorage
  await context.storageState({ path: statePath });
  console.log(`\n✅ 쿠키 저장 완료: ${statePath}`);

  // [2026-04-22] 저장 직후 쿠키 수명 진단 — "로그인 유지" 체크 됐는지 확인
  // 주요 인증 쿠키 이름 패턴: _T_, __T_, LSID, ALID, TIARA, DID, KAKAO_AUTH
  const state = JSON.parse(require("node:fs").readFileSync(statePath, "utf8")) as {
    cookies?: Array<{ name: string; domain?: string; expires?: number }>;
  };
  // 주의: `_T_ANO` (400일 익명 추적) 는 인증 쿠키 아님 → 제외.
  const AUTH_NAMES = new Set([
    "_T_",
    "_T_SECURE",
    "__T_",
    "__T_SECURE",
    "LSID",
    "ALID",
    "TIARA",
    "DID",
  ]);
  const authCookies = (state.cookies ?? []).filter(
    (c) =>
      (AUTH_NAMES.has(c.name) || c.name.startsWith("KAKAO_AUTH")) &&
      (c.domain ?? "").match(/\.(daum|kakao)(\.com|\.net)/),
  );
  const persistentAuth = authCookies.filter((c) => (c.expires ?? -1) > 0);
  const nowSec = Date.now() / 1000;
  if (persistentAuth.length === 0) {
    console.log("");
    console.log("⚠️  장기 인증 쿠키가 없습니다 (세션 쿠키만 저장됨).");
    console.log("   '로그인 상태 유지' 체크박스를 클릭하지 않았을 수 있습니다.");
    console.log("   쿠키 수명이 짧아 ~1일 내 만료 예상. 재로그인 권장.");
  } else {
    const minExpires = Math.min(...persistentAuth.map((c) => c.expires ?? 0));
    const daysLeft = ((minExpires - nowSec) / 86400).toFixed(1);
    console.log("");
    console.log(`✅ 장기 인증 쿠키 ${persistentAuth.length}개 확인 / 최단 만료까지 ${daysLeft}일 남음`);
    if (Number(daysLeft) < 7) {
      console.log("   ⚠️  7일 미만 — '로그인 상태 유지' 체크 여부 재확인 권장");
    }
  }
  console.log("");
  console.log("이제 다음 명령으로 GitHub Secret 갱신:");
  console.log("  npx tsx scripts/refresh-cafe-cookie.ts --skip-login");

  await browser.close();
}

main().catch((err) => {
  console.error("로그인 스크립트 실패:", err);
  process.exit(1);
});
