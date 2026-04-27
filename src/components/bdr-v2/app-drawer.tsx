"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ThemeSwitch } from "./theme-switch";
import type { AppNavUser } from "./app-nav";

/* ============================================================
 * AppDrawer (BDR v2 모바일 드로어)
 *
 * 이유(왜):
 *   v2 원본은 데스크탑에서 가로 탭 네비, 모바일에서 햄버거 → 우측 슬라이드
 *   드로어로 전환한다. CSS(.drawer) 자체는 globals.css에 이미 이식되어 있어
 *   React 부분만 구현.
 *
 * 방법(어떻게):
 *   - open=true 시 body scroll lock + backdrop + drawer 렌더
 *   - 탭 8개 Link + 구분선 + 글쓰기/알림 보조 링크 + 하단 ThemeSwitch + 세션 정보
 *   - 항목 클릭 시 Next.js Link가 페이지 이동을 처리하며, AppNav의 pathname effect가
 *     open 상태를 자동으로 false로 돌린다 (AppNav 내부 처리)
 * ============================================================ */

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  tabs: { id: string; href: string; label: string }[];
  isActive: (href: string) => boolean;
  user: AppNavUser | null;
}

export function AppDrawer({ open, onClose, tabs, isActive, user }: AppDrawerProps) {
  // body scroll lock (v2 원본 동작 동일)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleLogout = async () => {
    try {
      await fetch("/api/web/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // 무시 — 로그인 페이지 이동은 그대로 진행
    }
    window.location.href = "/login";
  };

  if (!open) return null;

  return (
    <>
      {/* 반투명 배경 — 클릭 시 닫힘 */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden
      />

      {/* 우측 슬라이드 패널 */}
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="주 메뉴"
      >
        {/* 헤더 — 제목 + 닫기 */}
        <div className="drawer__head">
          <div className="drawer__head-title">
            MyBDR<span className="dot">.</span>
          </div>
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            ×
          </button>
        </div>

        {/* 본문 — 탭 8개 + 보조 액션 */}
        <div className="drawer__body">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="drawer__item"
              data-active={isActive(t.href)}
              onClick={onClose}
            >
              <span>{t.label}</span>
              {/* chevron — v2 원본 SVG 그대로 */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ))}

          <div className="drawer__divider" />

          {/* 보조: 글쓰기 (커뮤니티 작성) */}
          <Link href="/community/new" className="drawer__item" onClick={onClose}>
            <span>글쓰기</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>

          {/* 보조: 알림 (로그인 시에만) */}
          {user && (
            <Link href="/notifications" className="drawer__item" onClick={onClose}>
              <span>알림</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </Link>
          )}

          {/* 보조: 검색 */}
          <Link href="/search" className="drawer__item" onClick={onClose}>
            <span>검색</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>

          {/* 심판 유저 전용 바로가기 */}
          {user?.is_referee && (
            <Link href="/referee" className="drawer__item" onClick={onClose}>
              <span>심판 센터</span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
                aria-hidden
              >
                sports
              </span>
            </Link>
          )}

          {/* super_admin 전용 바로가기 */}
          {user?.role === "super_admin" && (
            <Link
              href="/admin"
              className="drawer__item"
              onClick={onClose}
              style={{ color: "var(--accent)" }}
            >
              <span>관리자</span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
                aria-hidden
              >
                admin_panel_settings
              </span>
            </Link>
          )}
        </div>

        {/* 푸터 — 테마 + 세션 정보 */}
        <div className="drawer__foot">
          <ThemeSwitch />
          {user ? (
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>{user.name}</span>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--ink-dim)",
                  cursor: "pointer",
                  padding: 0,
                  font: "inherit",
                  textDecoration: "underline",
                }}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Link href="/login" onClick={onClose}>
                로그인
              </Link>
              <span aria-hidden>·</span>
              <Link href="/signup" onClick={onClose}>
                회원가입
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
