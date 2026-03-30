"use client";

/* ============================================================
 * HomeGreeting — 홈 상단 인사말 / 소개 히어로
 *
 * 로그인 여부에 따라 다른 UI를 표시:
 * - 비로그인: 사이트 소개 히어로 + CTA 2개 (대회 찾기, 회원가입)
 * - 로그인: 개인화된 인사말 (기존 동작)
 *
 * 왜 클라이언트 컴포넌트인가: page.tsx가 ISR 서버 컴포넌트라
 * cookies/세션에 접근하면 정적 캐시가 깨진다.
 * 따라서 클라이언트에서 /api/web/me를 호출하여 로그인 여부를 판별한다.
 * ============================================================ */

import { useState, useEffect } from "react";
import Link from "next/link";
import { MySummaryHero } from "./my-summary-hero";

export function HomeGreeting() {
  const [user, setUser] = useState<{ name: string } | null | undefined>(undefined);

  // 마운트 시 로그인 상태 확인
  useEffect(() => {
    fetch("/api/web/me", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  // 로딩 중: 아무것도 표시하지 않음 (레이아웃 시프트 방지)
  if (user === undefined) {
    return <div className="h-32" />;
  }

  // 로그인 상태: 개인화 인사말 + 맞춤 요약 카드 슬라이드
  if (user) {
    return (
      <div className="space-y-4">
        <div className="mb-2">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            안녕하세요, {user.name}님
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            오늘도 좋은 경기 되세요!
          </p>
        </div>
        {/* 맞춤 요약 카드 슬라이드: 내 팀/다가오는 경기/내 기록/다음 대회 */}
        <MySummaryHero />
      </div>
    );
  }

  // 비로그인 상태: 소개 히어로 (파란 그라디언트 배경)
  return (
    <div
      className="rounded-2xl p-6 mb-2"
      style={{
        background: "linear-gradient(135deg, var(--color-info) 0%, var(--color-accent) 100%)",
      }}
    >
      {/* 농구 아이콘 + 타이틀 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-2xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
          sports_basketball
        </span>
        <span className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          BDR
        </span>
      </div>

      {/* 소개 문구 */}
      <p className="text-white/90 text-sm leading-relaxed mb-5">
        농구 대회를 찾고, 팀을 만들고, 경기에 참여하세요
      </p>

      {/* CTA 버튼 2개 */}
      <div className="flex gap-3">
        <Link
          href="/tournaments"
          className="flex-1 rounded-lg py-2.5 text-center text-sm font-bold transition-all active:scale-[0.97]"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
        >
          대회 찾아보기
        </Link>
        <Link
          href="/signup"
          className="flex-1 rounded-lg py-2.5 text-center text-sm font-bold text-[var(--color-info)] transition-all active:scale-[0.97]"
          style={{ backgroundColor: "#fff" }}
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}
