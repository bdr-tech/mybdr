"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeSwitch } from "./theme-switch";
import { AppDrawer } from "./app-drawer";

/* ============================================================
 * AppNav (BDR v2 상단 네비게이션)
 *
 * 이유(왜):
 *   기존 좌측 고정 사이드네비 + 상단 헤더 + 하단 탭 + 우측 사이드바 + PWA 배너
 *   구조를 v2 원본의 "상단 가로 네비(유틸리티 바 + 메인 탭)" 단일 구조로
 *   전면 교체한다. 모바일은 햄버거 → AppDrawer 슬라이드로 흡수.
 *
 * v2 원본과의 차이:
 *   - 원본 setRoute 기반 SPA → Next.js Link 기반
 *   - 원본 테마 props 드릴링 → ThemeSwitch 내부에서 DOM 직접 세팅
 *   - ProfileDropdown "더보기"는 원본 moreItems(28개 중 실제 라우트만 추린 12개)
 *     + 아바타 자체는 /profile 이동 Link 로 분리 (PM 확정안)
 *
 * 메뉴 탭 8개 (PM 확정안 2026-04-24):
 *   홈 / 경기 / 대회 / 단체 / 팀 / 코트 / 랭킹 / 커뮤니티
 *
 * 유틸리티바 텍스트 (하드코딩):
 *   MyBDR 커뮤니티 / 소개 / 요금제 / 도움말
 *   우측은 로그인 시 이름/설정/로그아웃, 비로그인 시 로그인 링크
 * ============================================================ */

export interface AppNavUser {
  name: string;
  role: string;
  is_referee?: boolean;
}

interface AppNavProps {
  user: AppNavUser | null;
  unreadCount: number;
  // [2026-04-22] rightAccessory(별 아이콘) prop 제거 — v2 시안에 존재하지 않음
}

// 메인 탭 8개 — PM 확정안
const tabs: { id: string; href: string; label: string }[] = [
  { id: "home", href: "/", label: "홈" },
  { id: "games", href: "/games", label: "경기" },
  { id: "tournaments", href: "/tournaments", label: "대회" },
  { id: "orgs", href: "/organizations", label: "단체" },
  { id: "teams", href: "/teams", label: "팀" },
  { id: "courts", href: "/courts", label: "코트" },
  { id: "rankings", href: "/rankings", label: "랭킹" },
  { id: "community", href: "/community", label: "커뮤니티" },
];

// 더보기 드롭다운 — v2 원본 moreItems 중 실제 라우트가 존재하는 항목만 추림
// (원본 중복 제거 + mybdr 실제 route 매핑)
const moreItems: { href: string; label: string; icon: string }[] = [
  { href: "/games/my-games", label: "내 신청 내역", icon: "assignment" },
  { href: "/notifications", label: "알림", icon: "notifications" },
  { href: "/live", label: "라이브 중계", icon: "play_circle" },
  { href: "/rankings", label: "랭킹", icon: "leaderboard" },
  { href: "/search", label: "검색", icon: "search" },
  { href: "/pricing", label: "요금제", icon: "workspace_premium" },
  { href: "/help/glossary", label: "도움말", icon: "help" },
];

export function AppNav({ user, unreadCount }: AppNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // 더보기 드롭다운: 외부 클릭/ESC 닫힘 (v2 원본 동작 그대로)
  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  // 라우트 변경 시 드롭다운/드로어 자동 닫힘
  useEffect(() => {
    setMoreOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  // 활성 탭 판별 — "/"는 정확 일치, 나머지는 prefix 매치
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // 아바타 이니셜 (최대 3글자, v2 원본 "RDM" 스타일 모노 폰트)
  const initials = useMemo(() => {
    if (!user?.name) return "BDR";
    return user.name.slice(0, 3).toUpperCase();
  }, [user?.name]);

  return (
    <nav className="app-nav">
      {/* ============================================================
       * 유틸리티 바 — v2 원본 하드코딩 텍스트 그대로
       * ============================================================ */}
      <div className="app-nav__utility">
        <div className="app-nav__utility-inner">
          <span>MyBDR 커뮤니티</span>
          <span className="sep" />
          <Link href="/about">소개</Link>
          <span className="sep" />
          <Link href="/pricing">요금제</Link>
          <span className="sep" />
          <Link href="/help/glossary">도움말</Link>
          <span className="app-nav__utility-spacer" />
          {user ? (
            <>
              <Link href="/profile">{user.name}</Link>
              <span className="sep" />
              <Link href="/profile/settings">설정</Link>
              <span className="sep" />
              <LogoutLink />
            </>
          ) : (
            <>
              <Link href="/login">로그인</Link>
              <span className="sep" />
              <Link href="/signup">회원가입</Link>
            </>
          )}
        </div>
      </div>

      {/* ============================================================
       * 메인 바 — 로고 / 탭 8개 / 우측 액션
       * ============================================================ */}
      <div className="app-nav__main">
        {/* 로고 (홈 이동) */}
        <Link href="/" className="app-nav__logo" prefetch>
          <Image
            src="/images/logo.png"
            alt="MyBDR"
            width={140}
            height={40}
            priority
            style={{ height: 28, width: "auto" }}
          />
          <span>
            MyBDR<span className="dot">.</span>
          </span>
        </Link>

        {/* 탭 8개 — 가로 스크롤 가능 (CSS에서 overflow-x 처리) */}
        <div className="app-nav__tabs">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              prefetch
              className="app-nav__tab"
              data-active={isActive(t.href)}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* 우측 액션 영역 */}
        <div className="app-nav__right">
          <ThemeSwitch />

          {/* 검색 */}
          <Link href="/search" className="btn btn--sm" title="검색" aria-label="검색">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              search
            </span>
          </Link>

          {/* 알림 — 로그인 시에만 표시, 미확인 수 있으면 빨간 점 */}
          {user && (
            <Link
              href="/notifications"
              className="btn btn--sm"
              title="알림"
              aria-label="알림"
              style={{ position: "relative" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                notifications
              </span>
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
              )}
            </Link>
          )}

          {/* 더보기 드롭다운 — v2 원본 moreItems 패턴 */}
          <div ref={moreRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="btn btn--sm"
              title="더보기"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              style={{ fontSize: 12, fontWeight: 600, padding: "0 10px" }}
            >
              더보기
              <span
                style={{
                  fontSize: 9,
                  marginLeft: 4,
                  display: "inline-block",
                  transform: moreOpen ? "rotate(180deg)" : "none",
                  transition: "transform .15s",
                }}
              >
                ▼
              </span>
            </button>
            {moreOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  minWidth: 220,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--sh-lift, var(--sh-lg))",
                  borderRadius: 8,
                  padding: "6px 0",
                  zIndex: 30,
                }}
              >
                {moreItems.map((m) => {
                  const active = isActive(m.href);
                  return (
                    <Link
                      key={m.href + m.label}
                      href={m.href}
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 14px",
                        fontSize: 13,
                        color: "var(--ink)",
                        textDecoration: "none",
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: "var(--ink-mute)" }}
                      >
                        {m.icon}
                      </span>
                      <span>{m.label}</span>
                    </Link>
                  );
                })}
                {/* super_admin 전용: 관리자 진입 */}
                {user?.role === "super_admin" && (
                  <>
                    <div
                      aria-hidden
                      style={{ height: 1, background: "var(--border)", margin: "4px 0" }}
                    />
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 14px",
                        fontSize: 13,
                        color: "var(--accent)",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16 }}
                      >
                        admin_panel_settings
                      </span>
                      <span>관리자</span>
                    </Link>
                  </>
                )}
                {/* 심판 유저 전용: 심판 센터 진입 */}
                {user?.is_referee && (
                  <Link
                    href="/referee"
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      fontSize: 13,
                      color: "var(--ink)",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, color: "var(--ink-mute)" }}
                    >
                      sports
                    </span>
                    <span>심판 센터</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 아바타 — /profile 이동 Link (PM 확정안: 드롭다운 X, 직접 이동) */}
          {user ? (
            <Link
              href="/profile"
              className="btn btn--sm"
              title="내 프로필"
              aria-label="내 프로필"
              style={{
                padding: "0 8px 0 4px",
                gap: 6,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  background: "var(--bdr-red)",
                  color: "#fff",
                  fontFamily: "var(--ff-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 3,
                }}
              >
                {initials}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="btn btn--accent btn--sm" title="로그인">
              로그인
            </Link>
          )}

          {/* 모바일 햄버거 — 900px 이하에서만 보이도록 CSS에서 처리 */}
          <button
            type="button"
            className="app-nav__burger"
            aria-label="메뉴 열기"
            onClick={() => setDrawerOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* 하단 1px 구분선 (다크 모드에서 2px hard 강조) */}
      <div className="app-nav__bottom-line" />

      {/* 모바일 드로어 — open 상태 관리는 여기서 */}
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tabs={tabs}
        isActive={isActive}
        user={user}
      />
    </nav>
  );
}

/* ============================================================
 * LogoutLink — 유틸리티바 "로그아웃" 전용
 * 이유: 기존 ProfileDropdown의 handleLogout과 동일 API(POST /api/web/logout) 사용.
 * 별도 분리 이유 = AppNav utility는 <a> 형태가 필요하기 때문에 button+a 스타일 싱크.
 * ============================================================ */
function LogoutLink() {
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/web/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // 네트워크 실패해도 로그인 페이지로 이동 (세션 클라이언트만 꺼도 UX상 OK)
    }
    window.location.href = "/login";
  };
  return (
    <a href="/login" onClick={handleLogout}>
      로그아웃
    </a>
  );
}
