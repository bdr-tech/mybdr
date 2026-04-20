"use client";

/* ============================================================
 * HomeHero — 홈 히어로 영역 (로그인 분기)
 *
 * 로그인 여부에 따라 다른 상단 UI를 표시:
 * - 로그인: ProfileWidget + QuickActions + NewsFeed
 * - 비로그인: 소개 히어로 + QuickActions + NewsFeed
 *
 * page.tsx가 ISR 서버 컴포넌트이므로, 클라이언트에서
 * /api/web/me를 호출하여 로그인 상태를 판별한다.
 *
 * PC (md 이상)에서는 ProfileWidget + NewsFeed를 2열 그리드로 배치.
 * ============================================================ */

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ProfileWidget } from "./profile-widget";
import { QuickActions } from "./quick-actions";
import { NewsFeed } from "./news-feed";

// 대시보드 API 응답 타입 (QuickActions/ProfileWidget/NewsFeed에 props로 전달)
export interface DashboardData {
  nextGame: {
    title: string;
    scheduledAt: string | null;
    venueName: string | null;
    city: string | null;
    gameType: string | null;
    uuid: string;
  } | null;
  activeTournament: {
    id: number;
    name: string;
    status: string;
    teamName: string | null;
    startDate: string | null;
  } | null;
  frequentCourts: { id: string; name: string; visitCount: number }[];
  activityProfile: {
    dominantType: "new" | "checkin" | "game" | "pickup";
    checkinCount: number;
    gameCount: number;
    pickupCount: number;
  };
  preferredRegions: string[];
  preferredDays: string[];
}

export function HomeHero() {
  // undefined: 로딩 중, null: 비로그인, object: 로그인
  const [user, setUser] = useState<{ name: string } | null | undefined>(
    undefined
  );

  // 마운트 시 로그인 상태 확인
  useEffect(() => {
    fetch("/api/web/me", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  // 로그인 시에만 대시보드 데이터 패치 (개인화용)
  const { data: dashboardData } = useSWR<DashboardData>(
    user ? "/api/web/dashboard" : null,
    { dedupingInterval: 30000 }
  );

  // 로딩 중: 높이 예약으로 레이아웃 시프트 방지
  if (user === undefined) {
    return <div className="h-48" />;
  }

  // 로그인 상태
  if (user) {
    return (
      <div className="space-y-4">
        {/* PC: 프로필 위젯 + (소식+퀵액션)을 2열, 높이 맞춤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-stretch">
          {/* 왼쪽: 프로필 위젯 (높이 자동 맞춤) */}
          <ProfileWidget dashboardData={dashboardData ?? null} />
          {/* 오른쪽: 소식 피드 + 퀵 액션 (세로 스택, 프로필과 높이 맞춤) */}
          <div className="flex flex-col gap-4">
            <NewsFeed preferredRegions={dashboardData?.preferredRegions} />
            <QuickActions dashboardData={dashboardData ?? null} />
          </div>
        </div>
      </div>
    );
  }

  // 비로그인 상태: 소개 히어로 + 퀵 액션 + 소식
  return (
    <div className="space-y-4">
      {/* 소개 히어로: 2K Neon Style Banner */}
      <div
        className="p-8 relative overflow-hidden rounded-md shadow-glow-accent group"
        style={{
          background:
            "linear-gradient(135deg, var(--color-info) 0%, var(--color-accent) 80%, black 100%)",
        }}
      >
        {/* 2K 스타일 투명 워터마크 배경 텍스트 */}
        <div className="watermark-text z-0 group-hover:scale-105 transition-transform duration-700 opacity-20 text-[var(--color-text-on-primary)]">
          2K26
        </div>

        <div className="relative z-10">
          {/* 큰 제목 */}
          <h1
            className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tighter drop-shadow-xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            BDR BASKET
          </h1>
          {/* 부제목 */}
          <p className="text-white/85 text-base md:text-lg leading-relaxed mb-6 font-bold tracking-tight drop-shadow-md">
            농구인을 위한 올인원 매칭 아레나
          </p>
          {/* 시작하기 버튼 (2K 버튼 스타일) */}
          <Link
            href="/signup"
            className="inline-block rounded-sm bg-[var(--color-card)] text-[var(--color-text-primary)] px-8 py-3 text-sm font-black uppercase transition-all duration-300 hover:scale-[1.03] hover:bg-[var(--color-primary)] hover:text-white hover:shadow-glow-primary hover:tracking-wide active:scale-95"
          >
            PLAY NOW
          </Link>
          {/* 처음 방문자 도움말 링크 — W4 L1 도메인 용어 안내 */}
          {/* "대회/경기/픽업/게스트/디비전/시드/토너먼트/풀리그" 구분을 한 곳에서 제공 */}
          <div className="mt-3">
            <Link
              href="/help/glossary"
              className="inline-flex items-center gap-1 text-xs font-semibold text-white/80 underline-offset-2 hover:text-white hover:underline"
            >
              처음이세요? 용어 사전 보기
              <span className="material-symbols-outlined text-sm" aria-hidden>
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* 퀵 액션 */}
      <QuickActions />

      {/* 소식 피드 */}
      <NewsFeed />
    </div>
  );
}
