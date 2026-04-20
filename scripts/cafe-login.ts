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
  console.log("1) 열린 브라우저에서 다음 로그인");
  console.log("2) IVHA 게시판에서 글 하나 클릭 → 본문이 보이는지 확인");
  console.log("3) 터미널로 돌아와 [Enter]");
  console.log(bar);

  try {
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  } catch (err) {
    // 네트워크 느릴 때도 페이지는 로드 중일 수 있음 — 경고만
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  초기 페이지 이동 경고 (계속 진행): ${msg}`);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question("로그인 + 본문 확인 완료 후 [Enter] ");
  rl.close();

  // storageState 저장 — cookies(HttpOnly 포함) + localStorage/sessionStorage
  await context.storageState({ path: statePath });
  console.log(`\n✅ 쿠키 저장 완료: ${statePath}`);
  console.log("이제 다음 명령으로 Phase 2a 재실행하세요:");
  console.log(
    "  npx tsx --env-file=.env.local scripts/sync-cafe.ts --board=IVHA --limit=3 --with-body --article-limit=2 --debug",
  );

  await browser.close();
}

main().catch((err) => {
  console.error("로그인 스크립트 실패:", err);
  process.exit(1);
});
