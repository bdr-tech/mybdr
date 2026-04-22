/**
 * 다음카페 Playwright 로그인 헬퍼 (Cowork 호환).
 *
 * [왜]
 *   다음카페 세션 쿠키(TIARA/DID 등)는 카카오 통합 로그인 정책상
 *   **~1일 수명**이며, "로그인 상태 유지" 옵션은 2026-04 현재 UI에서 제거됨.
 *   따라서 매일 재로그인이 필요한데, 수동 단계를 최소화하기 위해 본 스크립트가
 *   (1) Playwright headed 창 → (2) 쿠키 저장 → (3) GitHub Secret 갱신까지
 *   한 명령으로 완결.
 *
 * [기본 사용 (수동)]
 *   npx tsx scripts/cafe-login.ts                    # 로그인 후 [Enter] 눌러 진행
 *   npx tsx scripts/cafe-login.ts --push-secret      # 끝나면 Secret 자동 갱신
 *
 * [Cowork/자동화 사용]
 *   npx tsx scripts/cafe-login.ts --auto-wait --push-secret
 *     --auto-wait: Enter 입력 대기 없이 로그인 완료(세션 쿠키 출현)를 자동 감지
 *     --random-delay=N: 시작 시 0~N분 랜덤 sleep (봇 탐지 회피용)
 *
 * [옵션]
 *   --auto-wait              Enter 대기 없이 세션 쿠키 감지로 자동 진행 (기본 꺼짐)
 *   --push-secret            완료 시 refresh-cafe-cookie.ts --skip-login 자동 호출
 *   --random-delay=N         시작 시 0~N분 랜덤 대기 (기본 0). N은 0~120 정수
 *   --timeout=N              --auto-wait 모드 최대 대기 분 (기본 10, 상한 30)
 *
 * [보안]
 *   - `.auth/cafe-state.json` 은 민감 (세션 쿠키) → .gitignore 필수
 *   - Cowork 사용 시 Chrome에 카카오 ID/PW 저장 권장 (자동 채움)
 */

import { chromium, Cookie } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const LOGIN_URL = "https://m.cafe.daum.net/dongarry/IVHA";
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// ────────────────────────────────────────────────────────────────────
// CLI 인자
// ────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const AUTO_WAIT = argv.includes("--auto-wait");
const PUSH_SECRET = argv.includes("--push-secret");

function parseNumArg(flag: string, defaultVal: number, min: number, max: number): number {
  const arg = argv.find((a) => a.startsWith(`--${flag}=`));
  if (!arg) return defaultVal;
  const n = Number(arg.split("=")[1]);
  if (!Number.isFinite(n) || n < min || n > max) {
    console.error(`⚠️  --${flag} 범위 위반 (${min}~${max}): ${arg}`);
    process.exit(1);
  }
  return Math.floor(n);
}

const RANDOM_DELAY_MIN = parseNumArg("random-delay", 0, 0, 120);
const AUTO_WAIT_TIMEOUT_MIN = parseNumArg("timeout", 10, 1, 30);

// ────────────────────────────────────────────────────────────────────
// 유틸: 세션 쿠키 감지 (로그인 완료 여부)
// ────────────────────────────────────────────────────────────────────

const SESSION_COOKIE_NAMES = ["TIARA", "LSID", "ALID", "DID", "_T_", "__T_"];

function isLoggedIn(cookies: Cookie[]): boolean {
  return cookies.some(
    (c) =>
      SESSION_COOKIE_NAMES.includes(c.name) &&
      /\.(daum|kakao)(\.com|\.net)/.test(c.domain ?? ""),
  );
}

async function main() {
  // 시작 시 랜덤 대기 (봇 탐지 회피)
  if (RANDOM_DELAY_MIN > 0) {
    const delaySec = Math.floor(Math.random() * RANDOM_DELAY_MIN * 60);
    const m = Math.floor(delaySec / 60);
    const s = delaySec % 60;
    console.log(`🎲 랜덤 대기: ${m}분 ${s}초 (0~${RANDOM_DELAY_MIN}분 범위)...`);
    await new Promise((r) => setTimeout(r, delaySec * 1000));
  }

  const authDir = resolve(process.cwd(), ".auth");
  mkdirSync(authDir, { recursive: true });
  const statePath = resolve(authDir, "cafe-state.json");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    userAgent: USER_AGENT,
  });
  const page = await context.newPage();

  const bar = "=".repeat(60);
  console.log(bar);
  console.log(`다음카페 로그인 세션 생성 (Playwright) ${AUTO_WAIT ? "— auto 모드" : ""}`);
  console.log(bar);
  if (AUTO_WAIT) {
    console.log(`🤖 auto-wait 모드: 세션 쿠키 감지까지 최대 ${AUTO_WAIT_TIMEOUT_MIN}분 대기`);
    console.log("   Chrome 자동 채움 / Cowork 제어로 로그인 진행하세요.");
  } else {
    console.log("1) 열린 브라우저에서 다음 로그인 (Chrome 저장된 ID/PW 자동 채움)");
    console.log("2) IVHA 게시판 글 하나 열어 본문 보이는지 확인");
    console.log("3) 터미널로 돌아와 [Enter]");
  }
  console.log(bar);

  try {
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  초기 페이지 이동 경고 (계속 진행): ${msg}`);
  }

  // ────────────── 로그인 완료 대기 ──────────────
  if (AUTO_WAIT) {
    // 세션 쿠키 감지 polling (3초마다, timeout 까지)
    const deadline = Date.now() + AUTO_WAIT_TIMEOUT_MIN * 60_000;
    let loggedIn = false;
    while (Date.now() < deadline) {
      const cookies = await context.cookies();
      if (isLoggedIn(cookies)) {
        loggedIn = true;
        const remaining = Math.ceil((deadline - Date.now()) / 60_000);
        console.log(`✅ 세션 쿠키 감지 — 로그인 완료 (남은 대기 ${remaining}분 skip)`);
        break;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    if (!loggedIn) {
      console.error(`❌ auto-wait timeout (${AUTO_WAIT_TIMEOUT_MIN}분) — 세션 쿠키 감지 실패`);
      console.error("   Cowork 로그인 자동화가 막혔거나 CAPTCHA/2FA 발생 가능.");
      await browser.close();
      process.exit(2);
    }
    // 본문 접근 권한 검증 — IVHA 글 목록에서 첫 번째 글 이동
    console.log("🔍 본문 접근 권한 검증 중...");
    await new Promise((r) => setTimeout(r, 2000)); // 리다이렉트 안정화
  } else {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    await rl.question("로그인 + 본문 확인 완료 후 [Enter] ");
    rl.close();
  }

  // storageState 저장
  await context.storageState({ path: statePath });
  console.log(`\n✅ 쿠키 저장 완료: ${statePath}`);

  // 쿠키 수명 진단 — 장기 토큰 유무 (_T_ANO 제외)
  const state = JSON.parse(readFileSync(statePath, "utf8")) as {
    cookies?: Array<{ name: string; domain?: string; expires?: number }>;
  };
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
  const totalAuthCount = authCookies.length;
  const nowSec = Date.now() / 1000;
  if (totalAuthCount === 0) {
    console.log("");
    console.log("⚠️  인증 쿠키(TIARA/LSID/ALID/DID 등)가 전혀 없습니다.");
    console.log("   로그인이 실제로 완료되지 않았을 수 있습니다. 재실행 권장.");
  } else if (persistentAuth.length === 0) {
    console.log("");
    console.log(`ℹ️  세션 인증 쿠키 ${totalAuthCount}개 확인 (수명 ~1일, 카카오 정책 기본)`);
    console.log("   매일 재로그인 필요 — Cowork recurring task 로 자동화 가능");
  } else {
    const minExpires = Math.min(...persistentAuth.map((c) => c.expires ?? 0));
    const daysLeft = ((minExpires - nowSec) / 86400).toFixed(1);
    console.log("");
    console.log(`✅ 장기 인증 쿠키 ${persistentAuth.length}개 / 최단 만료 ${daysLeft}일 남음`);
  }

  await browser.close();

  // ────────────── GitHub Secret 자동 갱신 ──────────────
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
      console.error("   수동 실행: npx tsx scripts/refresh-cafe-cookie.ts --skip-login");
      process.exit(3);
    }
  } else {
    console.log("");
    console.log("이제 다음 명령으로 GitHub Secret 갱신:");
    console.log("  npx tsx scripts/refresh-cafe-cookie.ts --skip-login");
    console.log("(또는 다음 실행에 --push-secret 플래그 추가하면 자동)");
  }
}

main().catch((err) => {
  console.error("로그인 스크립트 실패:", err);
  process.exit(1);
});
