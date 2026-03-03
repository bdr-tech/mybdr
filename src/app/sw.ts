import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, CacheFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// sw.ts는 webpack이 SW 컨텍스트로 컴파일 — ServiceWorkerGlobalScope 타입은 lib.webworker.d.ts에 있음
// 타입스크립트 일반 컨텍스트에서는 WorkerGlobalScope로 대체
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 인증/로그아웃/OAuth 콜백 → 절대 캐시 금지 (Set-Cookie가 SW 캐시에서 strip됨)
    {
      matcher: /^\/api\/auth\//,
      handler: new NetworkOnly(),
    },
    // 인증/보안 웹 API → 절대 캐시 금지
    {
      matcher: /^\/api\/web\/auth\//,
      handler: new NetworkOnly(),
    },
    // 실시간 점수 → 절대 캐시 금지
    {
      matcher: /^\/api\/v1\/games\/live\//,
      handler: new NetworkOnly(),
    },
    // 일반 API → Network First (10초 타임아웃 → 캐시 폴백)
    {
      matcher: /^\/api\//,
      handler: new NetworkFirst({ networkTimeoutSeconds: 10 }),
    },
    // 이미지/정적 에셋 → Cache First (7일)
    {
      matcher: /\.(?:png|jpg|jpeg|webp|svg|ico)$/,
      handler: new CacheFirst({
        cacheName: "images",
        plugins: [],
      }),
    },
    // 나머지 → defaultCache (Next.js 정적 에셋 포함)
    ...defaultCache,
  ],
});

serwist.addEventListeners();
