"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider, usePreferFilter } from "@/contexts/prefer-filter-context";
import { ToastProvider } from "@/contexts/toast-context";
// BDR v2 신규 가로 네비 — 유틸리티 바 + 메인 탭 + 모바일 드로어 일체형
import { AppNav, type AppNavUser } from "@/components/bdr-v2/app-nav";

/* ============================================================
 * WebLayout (BDR v2 전환 후 전면 단순화)
 *
 * 이유(왜):
 *   Phase 0~1에서 v2 토큰/Home 섹션 교체가 완료됐고, PM 확정안에 따라
 *   상단 가로 네비(v2 AppNav) 단일 구조로 전환한다. 기존의 좌측 고정
 *   사이드네비 / 상단 헤더 / 하단 탭 / 우측 사이드바 / PWA 배너 / SlideMenu /
 *   MoreTabTooltip / ProfileCompletionBanner / NotificationBadge 등은
 *   전부 미렌더 처리(파일은 보존).
 *
 *   유지 사항:
 *   - SWRProvider / PreferFilterProvider / ToastProvider
 *   - /api/web/me + /api/web/notifications 폴링 로직 (AppNav 우측 뱃지용)
 *   - 기존 테마 초기 스크립트 (layout 루트 레이아웃에서 처리)
 *   - Footer
 *
 * 방법(어떻게):
 *   - WebLayoutInner: user/unreadCount fetch → AppNav 에 props 전달
 *   - main: 풀폭. 페이지 내부에서 `.page` 또는 `max-w-*` 로 필요 시 제약
 *     (Home 등은 이미 자체 컨테이너 가짐)
 *
 * [2026-04-22] v2 시안 100% 매칭 작업 — 우측 별 아이콘(PreferFilterToggleButton) 제거.
 *   이유: v2 Games/Home 시안에 존재하지 않아 AppNav 가 시안과 불일치.
 *   PreferFilterProvider context 자체는 프로젝트 다른 페이지에서 사용하므로 유지,
 *   AppNav 노출만 제거. usePreferFilter 는 setLoggedIn 훅 호출용으로 여전히 필요.
 * ============================================================ */

function WebLayoutInner({ children }: { children: React.ReactNode }) {
  const { setLoggedIn } = usePreferFilter();
  const [user, setUser] = useState<AppNavUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // 마운트 시 유저 + 알림 병렬 fetch — 기존 로직 그대로 이식
  useEffect(() => {
    Promise.all([
      fetch("/api/web/me", { credentials: "include" })
        .then(async (r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/web/notifications", { credentials: "include" })
        // ⚠️ apiSuccess snake_case 변환: unread_count 로 접근 (errors.md 재발 이력 참조)
        .then(async (r) => (r.ok ? (r.json() as Promise<{ unread_count?: number }>) : null))
        .catch(() => null),
    ]).then(([userData, notifData]) => {
      // userData는 라우트에서 snake_case/camelCase 혼재 가능성 → AppNav에는 최소 필드만
      if (userData) {
        const u = userData as {
          name?: string;
          role?: string;
          prefer_filter_enabled?: boolean;
          is_referee?: boolean;
        };
        setUser({
          name: u.name ?? "사용자",
          role: u.role ?? "user",
          is_referee: u.is_referee ?? false,
        });
        setLoggedIn(true, u.prefer_filter_enabled ?? false);
        if (notifData) setUnreadCount(notifData.unread_count ?? 0);
      } else {
        setLoggedIn(false, false);
      }
    });
  }, [setLoggedIn]);

  // 알림 30초 폴링 + "모두 읽음" 이벤트 즉시 갱신 (기존 로직 유지)
  useEffect(() => {
    if (!user) return;
    const poll = () => {
      fetch("/api/web/notifications", { credentials: "include" })
        .then(async (r) => {
          if (r.ok) {
            const data = (await r.json()) as { unread_count?: number };
            setUnreadCount(data.unread_count ?? 0);
          }
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 30000);

    // notifications 페이지에서 "모두 읽음" 시 헤더 뱃지 즉시 0으로 (M6)
    const handleReadAll = () => setUnreadCount(0);
    window.addEventListener("notifications:read-all", handleReadAll);

    return () => {
      clearInterval(id);
      window.removeEventListener("notifications:read-all", handleReadAll);
    };
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      {/* 상단 가로 네비 — utility bar + 메인 탭 + 모바일 drawer 일체.
       * [2026-04-22] v2 시안 매칭: rightAccessory(별 아이콘) 제거. */}
      <AppNav user={user} unreadCount={unreadCount} />

      {/* 메인 — 풀폭. 각 페이지가 자체 `.page` 컨테이너로 폭 제어 */}
      <main className="flex-1">{children}</main>

      {/* 푸터 — 기존 그대로 재사용, 풀폭 하단 */}
      <Footer />
    </div>
  );
}

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <PreferFilterProvider>
        <ToastProvider>
          <WebLayoutInner>{children}</WebLayoutInner>
        </ToastProvider>
      </PreferFilterProvider>
    </SWRProvider>
  );
}
