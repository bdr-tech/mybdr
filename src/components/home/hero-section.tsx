"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PersonalHero } from "./personal-hero";

export function HeroSection() {
  const [state, setState] = useState<"loading" | "logged-in" | "guest">("loading");
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // 개발서버에서 Turbopack 컴파일 지연으로 무한 로딩 방지용 타임아웃
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

  if (state === "loading") {
    return (
      <div className="h-[160px] animate-pulse rounded-[20px] bg-gradient-to-br from-[#111827] to-[#1F2937]" />
    );
  }

  if (state === "logged-in" && dashboardData) {
    return <PersonalHero preloadedData={dashboardData} />;
  }

  return (
    <section className="relative overflow-hidden rounded-[20px] bg-[#111827] px-8 py-10 md:px-12 md:py-14">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      {/* 그라데이션 오버레이 */}
      <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#E31B23]/20 to-transparent" />

      <div className="relative text-center">
        <h1 className="mb-3 text-4xl font-extrabold uppercase tracking-wide text-white md:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
          <span className="text-[#E31B23]">B</span>asketball{" "}
          <span className="text-[#E31B23]">D</span>aily{" "}
          <span className="text-[#E31B23]">R</span>outine
        </h1>
        <p className="mb-8 text-base text-white/60">농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요</p>
        <div className="flex justify-center gap-3">
          <Link href="/games" prefetch={true}>
            <Button>경기 찾기</Button>
          </Link>
          <Link href="/tournaments" prefetch={true}>
            <Button variant="secondary">대회 둘러보기</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
