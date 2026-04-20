import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // localStorage 충돌 방지 (순차 실행)
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      // iPhone 14 디바이스 프로파일(webkit 기본)은 chromium-only 환경에서 실행 불가
      // → Pixel 7(chromium 기반 + 모바일 뷰포트/터치) 사용으로 대체
      name: "mobile",
      use: { ...devices["Pixel 7"] }, // chromium + 412 x 915 + 모바일 UA
    },
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
