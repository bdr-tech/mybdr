"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { PersonalHero } from "./personal-hero";

export function HeroSection() {
  const [state, setState] = useState<"loading" | "logged-in" | "guest">("loading");
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    /* 개발서버에서 Turbopack 컴파일 지연으로 무한 로딩 방지용 타임아웃 */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch("/api/web/dashboard", { credentials: "include", signal: controller.signal })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setDashboardData(data);
          setState("logged-in");
        } else {
          setState("guest");
        }
      })
      .catch(() => setState("guest"))
      .finally(() => clearTimeout(timeout));
  }, []);

  /* 로딩 스켈레톤: bdr_6 히어로 비율로 표시 */
  if (state === "loading") {
    return (
      <div className="aspect-[16/9] animate-pulse rounded-2xl bg-surface-low md:aspect-[21/9]" />
    );
  }

  /* 로그인 시: 개인 맞춤 히어로 슬라이드 */
  if (state === "logged-in" && dashboardData) {
    return <PersonalHero preloadedData={dashboardData} />;
  }

  /* ============================================================
   * 비로그인 히어로 — bdr_6 시안 완전 복제
   * - aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden
   * - 배경 이미지 + gradient 오버레이 (surface→투명)
   * - LIVE NOW 뱃지 + 대형 타이포 + CTA 2개
   * ============================================================ */
  return (
    <section className="group relative aspect-[16/9] overflow-hidden rounded-2xl bg-surface-low md:aspect-[21/9]">
      {/* 배경 이미지: 도시 농구 코트 야경 느낌의 그라디언트로 대체 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(227,27,35,0.15) 0%, rgba(27,60,135,0.12) 50%, rgba(19,19,19,0.9) 100%)",
        }}
      />

      {/* 하단→상단 그라디언트 오버레이: 콘텐츠 가독성 확보 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, var(--color-surface) 0%, var(--color-surface)/40 40%, transparent 100%)",
        }}
      />

      {/* 장식용 농구공 패턴 (우측 하단, 반투명) */}
      <div className="absolute -bottom-10 -right-10 text-[200px] leading-none opacity-[0.04] select-none">
        🏀
      </div>

      {/* 메인 콘텐츠: 하단 좌측에 배치 (bdr_6 스타일) */}
      <div className="absolute bottom-0 left-0 w-full space-y-4 p-8 md:w-2/3">
        {/* LIVE NOW 뱃지 + 서브 텍스트 */}
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            LIVE NOW
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
            농구인을 위한 플랫폼
          </span>
        </div>

        {/* 헤드라인: Space Grotesk, tracking-tighter, 대형 타이포 */}
        <h1
          className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          <span style={{ color: "var(--color-primary)" }}>B</span>asketball{" "}
          <span style={{ color: "var(--color-primary)" }}>D</span>aily{" "}
          <span style={{ color: "var(--color-primary)" }}>R</span>outine
        </h1>

        {/* CTA 버튼 2개: gradient 버튼 + glass 버튼 */}
        <div className="flex gap-4 pt-4">
          <Link href="/games" prefetch={true}>
            <button
              className="flex items-center gap-2 rounded-lg px-8 py-3 font-bold text-white transition-transform active:scale-95"
              style={{
                background: "linear-gradient(to right, var(--color-primary), var(--color-accent))",
              }}
            >
              경기 찾기
              <Zap size={16} fill="currentColor" />
            </button>
          </Link>
          <Link href="/tournaments" prefetch={true}>
            <button className="rounded-lg bg-white/10 px-8 py-3 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20">
              대회 둘러보기
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
