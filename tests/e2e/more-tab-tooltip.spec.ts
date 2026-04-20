import { test, expect } from "@playwright/test";

/* ============================================================
 * MoreTabTooltip E2E 테스트 (6체크)
 *
 * 주의: 실제 구현에 맞춘 셀렉터
 * - 툴팁 텍스트: "단체·팀·코트·랭킹은 여기 있어요"
 * - X 버튼 aria-label: "닫기"
 * - localStorage 키: "more_tab_tooltip_shown"
 * - 뷰포트: lg(1024px) 이상에서는 lg:hidden 으로 숨김
 * ============================================================ */

const TOOLTIP_TEXT = "단체·팀·코트·랭킹은 여기 있어요";
const TOOLTIP_KEY = "more_tab_tooltip_shown";

test.describe("MoreTabTooltip - 모바일 (iPhone 14)", () => {
  // iPhone 14 device config는 playwright.config.ts의 mobile project에서 주입
  test.beforeEach(async ({ page, context }) => {
    // 각 테스트 전 쿠키/localStorage 완전 초기화
    await context.clearCookies();
    // localStorage는 origin 기반이므로 먼저 페이지 로드 후 clear
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      try {
        window.localStorage.clear();
      } catch {}
    });
  });

  test("체크 1: 최초 방문 시 툴팁 표시", async ({ page }) => {
    // 초기화 후 새 페이지 로드 (useEffect 재실행)
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const tooltip = page.getByText(TOOLTIP_TEXT);
    await expect(tooltip).toBeVisible({ timeout: 3_000 });
  });

  test("체크 2: 3초 후 자동 닫힘 + localStorage 기록", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const tooltip = page.getByText(TOOLTIP_TEXT);
    await expect(tooltip).toBeVisible({ timeout: 3_000 });

    // 3초 auto-close + 300ms fade-out → 넉넉히 4초 대기
    await page.waitForTimeout(4_000);
    await expect(tooltip).not.toBeVisible();

    // localStorage 기록 확인
    const stored = await page.evaluate((k) => window.localStorage.getItem(k), TOOLTIP_KEY);
    expect(stored).toBe("1");
  });

  test("체크 3: X 버튼 클릭 — 툴팁만 닫히고 슬라이드 메뉴는 안 열림", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const tooltip = page.getByText(TOOLTIP_TEXT);
    await expect(tooltip).toBeVisible({ timeout: 3_000 });

    // X 버튼: role=tooltip 내부의 aria-label="닫기" 버튼
    // 주의: Pixel 7 모바일 뷰포트에서 툴팁이 viewport 경계 밖(우측 끝)에 위치해
    // Playwright의 실제 마우스 클릭/force 클릭 모두 "outside of viewport"로 실패함.
    // → dispatchEvent로 DOM click 이벤트를 직접 발화하여 위치 체크 우회.
    //   (React onClick 핸들러는 정상 호출되며 e.stopPropagation()도 실제로 실행됨)
    const closeBtn = page.locator('[role="tooltip"] button[aria-label="닫기"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.dispatchEvent("click");

    // 툴팁 사라짐 (fade-out 300ms + 약간 여유)
    await page.waitForTimeout(500);
    await expect(tooltip).not.toBeVisible();

    // 슬라이드 메뉴 열리지 않았는지 확인
    // 주의: SlideMenu(role="dialog")는 open=false 상태에서도 DOM에는 존재하며
    // `-translate-x-full` 클래스로 화면 밖에 숨겨져 있음 → isVisible()은 true 반환.
    // → 실제 "열림" 여부는 transform 클래스로 판정: translate-x-0 이면 열림.
    const slideMenuDialog = page.locator('[role="dialog"][aria-label="전체 메뉴"]');
    const dialogClass = await slideMenuDialog.getAttribute("class");
    expect(dialogClass).toContain("-translate-x-full"); // 닫힘 상태 유지
    expect(dialogClass).not.toMatch(/\btranslate-x-0\b/); // 열림 클래스 없음

    // localStorage 기록 확인 (X 클릭 시에도 "1" 저장되어야)
    const stored = await page.evaluate((k) => window.localStorage.getItem(k), TOOLTIP_KEY);
    expect(stored).toBe("1");
  });

  test("체크 4: 재방문 시 미노출 (localStorage 기록됨)", async ({ page }) => {
    // 첫 방문
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(TOOLTIP_TEXT)).toBeVisible({ timeout: 3_000 });

    // auto-close 대기 → localStorage 기록 유도
    await page.waitForTimeout(4_000);

    const stored = await page.evaluate((k) => window.localStorage.getItem(k), TOOLTIP_KEY);
    expect(stored).toBe("1");

    // 새로고침
    await page.reload({ waitUntil: "domcontentloaded" });

    // 2초 기다려도 툴팁이 안 보여야
    await page.waitForTimeout(2_000);
    const tooltip = page.getByText(TOOLTIP_TEXT);
    const visible = await tooltip.isVisible().catch(() => false);
    expect(visible).toBe(false);
  });

  test("체크 5: 리셋 후 재노출", async ({ page }) => {
    // localStorage에 이미 기록된 상태
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate((k) => window.localStorage.setItem(k, "1"), TOOLTIP_KEY);
    await page.reload({ waitUntil: "domcontentloaded" });

    // 안 뜸 확인
    await page.waitForTimeout(1_500);
    const tooltip = page.getByText(TOOLTIP_TEXT);
    const hiddenFirst = await tooltip.isVisible().catch(() => false);
    expect(hiddenFirst).toBe(false);

    // 리셋
    await page.evaluate((k) => window.localStorage.removeItem(k), TOOLTIP_KEY);
    await page.reload({ waitUntil: "domcontentloaded" });

    // 다시 뜸
    await expect(tooltip).toBeVisible({ timeout: 3_000 });
  });
});

// 데스크톱 검증 별도 describe
test.describe("MoreTabTooltip - 데스크톱 (lg:hidden)", () => {
  test("체크 6: 1440x900 뷰포트에서 툴팁 시각적 비표시", async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await context.clearCookies();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      try {
        window.localStorage.clear();
      } catch {}
    });
    await page.reload({ waitUntil: "domcontentloaded" });

    // lg:hidden 이므로 DOM이 아예 렌더되지 않거나(early return 케이스도 가능) visible:false
    await page.waitForTimeout(1_500);
    const tooltip = page.getByText(TOOLTIP_TEXT);
    const isVisible = await tooltip.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});
