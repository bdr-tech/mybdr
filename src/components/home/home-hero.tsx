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
      {/* 소개 히어로: 그라디언트 배경 */}
      <div
        className="rounded-xl p-6"
        style={{
          background:
            "linear-gradient(135deg, var(--color-info) 0%, var(--color-accent) 100%)",
        }}
      >
        {/* 큰 제목 */}
        <h1
          className="text-2xl font-extrabold text-white mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          BDR BASKET
        </h1>
        {/* 부제목 */}
        <p className="text-white/85 text-sm leading-relaxed mb-5">
          농구인을 위한 올인원 플랫폼
        </p>
        {/* 시작하기 버튼 */}
        <Link
          href="/signup"
          className="inline-block rounded-lg px-6 py-2.5 text-sm font-bold transition-all active:scale-[0.97]"
          style={{
            backgroundColor: "#fff",
            color: "var(--color-info)",
          }}
        >
          시작하기
        </Link>
      </div>

      {/* 퀵 액션 */}
      <QuickActions />

      {/* 소식 피드 */}
      <NewsFeed />
    </div>
  );
}
