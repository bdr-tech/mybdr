/**
 * 다음카페 Playwright 로그인 헬퍼 (방법 B: Chrome 프로필 재사용)
 *
 * [왜]
 *   다음카페 세션 쿠키(LSID/ALID/_T_)는 카카오 통합 로그인 정책상 ~1일 수명이며,
 *   "로그인 상태 유지" 옵션이 2026-04 기준 UI 에서 제거됨. 따라서 매일 재로그인이
 *   필요한데, 본 스크립트가 (1) 전용 Chrome 프로필 → (2) 자동 채움 로그인
 *   → (3) 쿠키 저장 → (4) GitHub Secret 갱신까지 한 명령으로 완결.
 *
 * [방법 B 핵심]
 *   - launchPersistentContext + .auth/chrome-profile 전용 프로필
 *   - 한 번 수동 로그인하며 Chrome 비밀번호 저장 → 이후 자동 채움
 *   - 직전 cafe-state.json 쿠키도 복원하여 세션이 살아있으면 즉시 인증
 *
 * [주의] Daum/Kakao 는 페이지 방문 즉시 추적용 쿠키(TIARA, DID, __T_, _T_ANO ...)
 *   를 익명 사용자에게도 발급함. 이를 인증으로 오인하면 익명 상태에서도
 *   "로그인 됨" 으로 잘못 종료됨. isLoggedIn() 은 LSID/ALID(.kakao.com) 또는
 *   _T_/_T_SECURE(.daum.net) 같은 진짜 인증 쿠키만 카운트.
 *
 * [사용]
 *   npx tsx scripts/cafe-login.ts                              # 수동 모드 (Enter 대기)
 *   npx tsx scripts/cafe-login.ts --push-secret                # 수동 + Secret 갱신
 *   npx tsx scripts/cafe-login.ts --auto-wait --push-secret    # 완전 무인
 *   npx tsx scripts/cafe-login.ts --auto-wait --timeout=5      # auto 5분 timeout
 *   npx tsx scripts/cafe-login.ts --random-delay=30            # 0-30분 랜덤 대기
 *
 * [옵션]
 *   --auto-wait              사람 Enter 없이 인증 쿠키 폴링 (자동 채움 전제)
 *   --timeout=N              auto-wait 폴링 timeout 분 (기본 5)
 *   --random-delay=N         시작 전 0-N 분 랜덤 대기 (봇 탐지 회피)
 *   --push-secret            완료 시 refresh-cafe-cookie.ts --skip-login 자동 호출
 *
 * [보안]
 *   - `.auth/cafe-state.json` 은 민감 (세션 쿠키) → .gitignore 필수
 *   - `.auth/chrome-profile/` 은 비밀번호 저장소 포함 → .gitignore 필수
 */

import { chromium, type Cookie } from "@playwright/test";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const LOGIN_URL = "https://m.cafe.daum.net/dongarry/IVHA";
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// ─── 플래그 파싱 ───
const argv = process.argv.slice(2);
const PUSH_SECRET = argv.includes("--push-secret");
const AUTO_WAIT = argv.includes("--auto-wait");

function readNumberFlag(name: string, fallback: number): number {
  const arg = argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  const v = Number(arg.split("=")[1]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}
const TIMEOUT_MIN = readNumberFlag("timeout", 5);
const RANDOM_DELAY_MIN = readNumberFlag("random-delay", 0);

// ─── 인증 쿠키 판별 ───
// _T_ANO 는 익명 추적 쿠키이므로 제외.
// LSID/ALID 는 .kakao.com 도메인의 카카오 통합 인증 쿠키.
// _T_/_T_SECURE 는 .daum.net 도메인의 다음 인증 쿠키 (단 _T_ANO 와 구분).
function isLoggedIn(cookies: Cookie[]): boolean {
  const hasKakaoAuth = cookies.some(
    (c) =>
      (c.name === "LSID" || c.name === "ALID") &&
      /\.kakao\.(com|net)$/.test(c.domain ?? ""),
  );
  const hasDaumAuth = cookies.some(
    (c) =>
      (c.name === "_T_" || c.name === "_T_SECURE") &&
      /\.daum\.net$/.test(c.domain ?? ""),
  );
  return hasKakaoAuth || hasDaumAuth;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const authDir = resolve(process.cwd(), ".auth");
  mkdirSync(authDir, { recursive: true });
  const statePath = resolve(authDir, "cafe-state.json");
  const profileDir = resolve(authDir, "chrome-profile");
  mkdirSync(profileDir, { recursive: true });

  // ─── 봇 회피 랜덤 대기 ───
  if (RANDOM_DELAY_MIN > 0) {
    const delaySec = Math.floor(Math.random() * RANDOM_DELAY_MIN * 60);
    console.log(
      `⏳ 봇 회피 랜덤 대기: ${delaySec}초 (~${(delaySec / 60).toFixed(1)}분)`,
    );
    await sleep(delaySec * 1000);
  }

  // ─── Chrome (전용 프로필) 기동 ───
  // channel: "chrome" + ignoreDefaultArgs 로 자동화 탐지 우회 → Chrome 자동 채움 활성화
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    channel: "chrome",
    viewport: { width: 414, height: 896 },
    userAgent: USER_AGENT,
    args: ["--disable-blink-features=AutomationControlled"],
    ignoreDefaultArgs: ["--enable-automation"],
  });
  const page = context.pages()[0] ?? (await context.newPage());

  // ─── 이전 쿠키 복원 ───
  // 직전 실행에서 받은 쿠키가 아직 살아있으면 페이지 방문만 해도 로그인 상태.
  if (existsSync(statePath)) {
    try {
      const prev = JSON.parse(readFileSync(statePath, "utf8")) as {
        cookies?: Cookie[];
      };
      if (prev.cookies && prev.cookies.length > 0) {
        await context.addCookies(prev.cookies);
        console.log(`🍪 이전 쿠키 ${prev.cookies.length}개 복원`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️  이전 쿠키 복원 실패 (계속 진행): ${msg}`);
    }
  } else {
    console.log("ℹ️  이전 쿠키 없음 — 최초 실행 또는 정리된 상태");
  }

  const bar = "=".repeat(60);
  console.log(bar);
  console.log(
    `다음카페 로그인 세션 생성 (Playwright)${AUTO_WAIT ? " — auto 모드" : ""}`,
  );
  console.log(bar);

  if (!AUTO_WAIT) {
    console.log("1) 열린 브라우저에서 다음 로그인 (Chrome 저장된 ID/PW 자동 채움)");
    console.log("2) IVHA 게시판 글 하나 열어 본문 보이는지 확인");
    console.log("3) 터미널로 돌아와 [Enter]");
    console.log(bar);
  } else {
    console.log(`auto-wait timeout: ${TIMEOUT_MIN}분 / 폴링 간격 5초`);
    console.log(bar);
  }

  try {
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  초기 페이지 이동 경고 (계속 진행): ${msg}`);
  }

  // ─── 인증 대기 ───
  if (AUTO_WAIT) {
    // 페이지 로드 직후 이미 인증돼 있으면 (쿠키 복원 성공) 즉시 통과
    let cookies = await context.cookies();
    if (!isLoggedIn(cookies)) {
      console.log("🔐 비로그인 감지 — 로그인 버튼 자동 클릭 시도...");
      const loginSelectors = [
        'a:has-text("로그인")',
        'a[href*="logins.daum.net"]',
        'a[href*="accounts.kakao.com"]',
        'a[href*="login"]',
      ];
      for (const sel of loginSelectors) {
        try {
          const el = page.locator(sel).first();
          if ((await el.count()) > 0) {
            await el.click({ timeout: 5000 }).catch(() => {});
            console.log(`   → 클릭 시도: ${sel}`);
            await page
              .waitForLoadState("domcontentloaded", { timeout: 10_000 })
              .catch(() => {});
            break;
          }
        } catch {
          /* skip */
        }
      }
    }

    // 폴링 — Chrome 자동 채움이 ID/PW 입력 + 로그인 버튼 클릭까지 진행
    const deadline = Date.now() + TIMEOUT_MIN * 60 * 1000;
    let announced = false;
    while (Date.now() < deadline) {
      cookies = await context.cookies();
      if (isLoggedIn(cookies)) {
        console.log("✅ 로그인 감지 (auto 모드)");
        break;
      }
      if (!announced) {
        console.log("⏳ 인증 쿠키 폴링 중...");
        announced = true;
      }
      await sleep(5000);
    }

    cookies = await context.cookies();
    if (!isLoggedIn(cookies)) {
      console.error("");
      console.error(`❌ auto-wait timeout (${TIMEOUT_MIN}분) — 로그인 미감지`);
      console.error("   가능 원인:");
      console.error("     1) Chrome 프로필에 ID/PW 미저장 → 수동 1회 로그인 필요");
      console.error("     2) 카카오 CAPTCHA 발생 → 수동 1회 통과 후 재시도");
      console.error("     3) 카카오 비밀번호 변경 → 새 비밀번호 저장 필요");
      console.error("   조치: README Step 3 참고 (수동 모드로 1회 실행)");
      await context.close();
      process.exit(2);
    }
  } else {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await rl.question("로그인 + 본문 확인 완료 후 [Enter] ");
    rl.close();
  }

  // ─── storageState 저장 ───
  await context.storageState({ path: statePath });
  console.log(`\n✅ 쿠키 저장 완료: ${statePath}`);

  // ─── 쿠키 진단 ───
  const state = JSON.parse(readFileSync(statePath, "utf8")) as {
    cookies?: Cookie[];
  };
  const allCookies = state.cookies ?? [];
  if (!isLoggedIn(allCookies)) {
    console.log("");
    console.log("⚠️  진짜 인증 쿠키(LSID/ALID/_T_)가 전혀 없습니다.");
    console.log("   로그인이 실제로 완료되지 않았을 수 있습니다. 재실행 권장.");
  } else {
    const authCookies = allCookies.filter(
      (c) =>
        c.name === "LSID" ||
        c.name === "ALID" ||
        c.name === "_T_" ||
        c.name === "_T_SECURE",
    );
    const persistent = authCookies.filter((c) => (c.expires ?? -1) > 0);
    if (persistent.length > 0) {
      const minExpires = Math.min(...persistent.map((c) => c.expires ?? 0));
      const daysLeft = ((minExpires - Date.now() / 1000) / 86400).toFixed(1);
      console.log("");
      console.log(
        `✅ 장기 인증 쿠키 ${persistent.length}개 / 최단 만료 ${daysLeft}일 남음`,
      );
    } else {
      console.log("");
      console.log(
        `ℹ️  세션 인증 쿠키 ${authCookies.length}개 (수명 ~1일, 카카오 정책)`,
      );
    }
  }

  await context.close();

  // ─── GitHub Secret 자동 갱신 ───
  if (PUSH_SECRET) {
    console.log("");
    console.log("─".repeat(60));
    console.log("🔐 GitHub Secret 자동 갱신 (--push-secret)");
    console.log("─".repeat(60));
    try {
      execSync("npx tsx scripts/refresh-cafe-cookie.ts --skip-login", {
        stdio: "inherit",
      });
      console.log("✅ Secret 갱신 완료");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Secret 갱신 실패: ${msg}`);
      console.error(
        "   수동 실행: npx tsx scripts/refresh-cafe-cookie.ts --skip-login",
      );
      process.exit(3);
    }
  } else {
    console.log("");
    console.log("이제 다음 명령으로 GitHub Secret 갱신:");
    console.log("  npx tsx scripts/refresh-cafe-cookie.ts --skip-login");
    console.log("(또는 다음부터 --push-secret 플래그로 자동화 권장)");
  }
}

main().catch((err) => {
  console.error("로그인 스크립트 실패:", err);
  process.exit(1);
});
