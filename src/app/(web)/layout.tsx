"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider, usePreferFilter } from "@/contexts/prefer-filter-context";
import {
  Home, Dribbble, Trophy, MapPin, Users, BarChart3,
  Settings, LogOut, Bell, User, LayoutGrid
} from "lucide-react";

/* ============================================================
 * 사이드바 네비게이션 항목 정의
 * bdr_6 시안 기준: 6개 메인 메뉴 + 하단 Settings/Logout
 * ============================================================ */
const sideNavItems = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/games", label: "경기 찾기", Icon: Dribbble },
  { href: "/tournaments", label: "대회", Icon: Trophy },
  { href: "#", label: "코트 정보", Icon: MapPin },
  { href: "/community", label: "커뮤니티", Icon: Users },
  { href: "#", label: "랭킹", Icon: BarChart3 },
];

/* 모바일 하단 네비바 항목: bdr_6 기준 5개 */
const bottomNavItems = [
  { href: "/", label: "Home", Icon: LayoutGrid },
  { href: "/games", label: "Matches", Icon: Dribbble },
  { href: "#", label: "Courts", Icon: MapPin },
  { href: "#", label: "Ranking", Icon: BarChart3 },
  { href: "/profile", label: "Profile", Icon: User },
];

/* ============================================================
 * WebLayoutInner — PreferFilterProvider 내부에서 usePreferFilter 사용
 * bdr_6 레이아웃: 좌측 사이드바(데스크탑) + 상단 미니헤더 + 하단 모바일 네비
 * ============================================================ */
function WebLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setLoggedIn } = usePreferFilter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  /* 마운트 시 로그인 상태 확인 */
  useEffect(() => {
    fetch("/api/web/me", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data);
        setLoggedIn(!!data);
      })
      .catch(() => null);
  }, [setLoggedIn]);

  /* 현재 경로가 활성 메뉴인지 판별 */
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  /* 로그아웃 핸들러 */
  const handleLogout = async () => {
    await fetch("/api/web/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-surface)" }}>
      {/* ========================================
       * 데스크탑 사이드바 (md 이상에서만 표시)
       * bdr_6: fixed left-0, w-64, bg-surface-low
       * ======================================== */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col gap-2 px-4 py-8 md:flex"
        style={{
          backgroundColor: "var(--color-surface-low)",
          boxShadow: "48px 0 48px rgba(0,0,0,0.3)",
        }}
      >
        {/* BDR Performance 로고 */}
        <div className="mb-8 px-4">
          <div
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            BDR Performance
          </div>
          <div
            className="text-xs opacity-70"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Elite Level
          </div>
        </div>

        {/* 메인 네비게이션 메뉴 */}
        <nav className="flex flex-1 flex-col gap-1">
          {sideNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "translate-x-1 text-white shadow-lg"
                    : "opacity-70 hover:bg-white/5 hover:opacity-100"
                }`}
                style={
                  active
                    ? {
                        /* 활성 메뉴: Red→Navy 그라디언트 배경 */
                        background: "linear-gradient(to right, var(--color-primary), var(--color-accent))",
                      }
                    : { color: "var(--color-text-primary)" }
                }
              >
                <item.Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 하단: Settings + Logout */}
        <div
          className="mt-auto flex flex-col gap-1 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-sm opacity-70 transition-all hover:bg-white/5 hover:opacity-100"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm opacity-70 transition-all hover:bg-white/5 hover:opacity-100"
            style={{ color: "var(--color-text-primary)" }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ========================================
       * 상단 미니 헤더 (fixed)
       * 모바일: BDR 로고 + 알림/프로필
       * 데스크탑: 지역명 + 알림/프로필 (사이드바 우측 영역에만)
       * ======================================== */}
      <header
        className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/10 px-6 py-4 backdrop-blur-xl md:pl-[calc(16rem+1.5rem)]"
        style={{ backgroundColor: "rgba(19, 19, 19, 0.80)" }}
      >
        {/* 모바일: BDR 로고 표시, 데스크탑: 지역명 표시 */}
        <div>
          <span
            className="text-2xl font-black italic tracking-tight md:hidden"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            BDR
          </span>
          <Link
            href="#"
            className="hidden text-sm font-bold transition-colors hover:text-white md:block"
            style={{ color: "var(--color-primary)" }}
          >
            강남구
          </Link>
        </div>

        {/* 우측: 알림 + 프로필 아이콘 */}
        <div className="flex items-center gap-4">
          <Link
            href="/notifications"
            className="transition-colors hover:text-white"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <Bell size={22} />
          </Link>
          {user ? (
            <Link
              href="/profile"
              className="transition-colors hover:text-white"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <User size={22} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-4 py-1.5 text-sm font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* ========================================
       * 메인 콘텐츠 영역
       * pt-20: 상단 미니헤더 아래 여백
       * pb-24: 모바일 하단 네비바 여백
       * md:pl-64: 데스크탑 사이드바 너비만큼 좌측 여백
       * ======================================== */}
      <main className="pt-20 pb-24 md:pb-12 md:pl-64">
        <div className="mx-auto max-w-7xl px-6">
          {children}
        </div>
      </main>

      {/* 풋터: 데스크탑에서는 사이드바만큼 좌측 패딩 */}
      <div className="md:pl-64">
        <Footer />
      </div>

      {/* ========================================
       * 모바일 하단 네비바 (md 이하에서만 표시)
       * bdr_6: 5개 아이콘, 활성=bg-primary rounded-2xl
       * ======================================== */}
      <nav
        className="fixed bottom-0 left-0 z-50 flex w-full items-end justify-around border-t border-white/5 px-4 pb-6 pt-2 backdrop-blur-2xl md:hidden"
        style={{
          backgroundColor: "rgba(19, 19, 19, 0.90)",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
                active
                  ? "mb-2 scale-110 rounded-2xl p-3 text-white"
                  : "p-2"
              }`}
              style={
                active
                  ? { backgroundColor: "var(--color-primary)" }
                  : { color: "var(--color-text-primary)", opacity: 0.6 }
              }
            >
              <item.Icon size={24} />
              <span
                className="mt-1 text-[10px] font-semibold"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================================================
 * WebLayout — 최상위 레이아웃
 * SWRProvider + PreferFilterProvider로 감싸고 WebLayoutInner 렌더
 * ============================================================ */
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <PreferFilterProvider>
        <WebLayoutInner>{children}</WebLayoutInner>
      </PreferFilterProvider>
    </SWRProvider>
  );
}
