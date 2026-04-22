"use client";

/* ============================================================
 * HomeSidebar -- 홈 우측 사이드바 래퍼 (클라이언트)
 *
 * 왜 별도 컴포넌트인가:
 * page.tsx에서 getWebSession()을 호출하면 cookies()로 인해 ISR이 무효화된다.
 * 로그인/비로그인 사이드바 분기를 클라이언트로 옮기면
 * page.tsx가 정적 캐시(ISR revalidate=60)를 활용할 수 있다.
 *
 * 동작 원리:
 * 1. 클라이언트에서 /api/web/me를 호출하여 로그인 여부 확인
 * 2. 로그인 → RightSidebarLoggedIn, 비로그인 → RightSidebarGuest 렌더링
 * 3. 로딩 중에는 비로그인 사이드바를 기본으로 표시 (비로그인이 대다수이므로)
 * ============================================================ */

import { useEffect, useState } from "react";
import { RightSidebarLoggedIn, type TeamData, type PostData } from "./right-sidebar-logged-in";
import { RightSidebarGuest } from "./right-sidebar-guest";

/* 서버에서 프리페치한 데이터를 그대로 전달받는 props
 * 사이드바 컴포넌트 내부에서 SWR fallbackData로 사용되므로
 * 자식 컴포넌트의 SWR 응답 타입과 정확히 동일한 구조를 명시한다
 * (기존 any 3건 제거 — 자식의 TeamData/PostData 재사용으로 단일 원본 유지) */
interface HomeSidebarProps {
  // /api/web/teams 프리페치 응답 ({ teams: [...] })
  fallbackTeams?: { teams: TeamData[] };
  // /api/web/community 프리페치 응답 ({ posts: [...] })
  fallbackCommunity?: { posts: PostData[] };
  // /api/web/stats 프리페치 응답 (snake_case 3필드)
  fallbackStats?: { team_count: number; match_count: number; user_count: number };
}

export function HomeSidebar({
  fallbackTeams,
  fallbackCommunity,
  fallbackStats,
}: HomeSidebarProps) {
  // null = 로딩 중, false = 비로그인, true = 로그인
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // /api/web/me로 로그인 여부만 확인 (layout.tsx와 동일한 패턴)
    fetch("/api/web/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("not logged in");
      })
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  // 로딩 중이거나 비로그인이면 Guest 사이드바 표시
  // (비로그인이 대다수이므로 깜빡임 최소화)
  if (isLoggedIn !== true) {
    return (
      <RightSidebarGuest
        fallbackTeams={fallbackTeams}
        fallbackCommunity={fallbackCommunity}
        fallbackStats={fallbackStats}
      />
    );
  }

  // 로그인 확인 후 LoggedIn 사이드바 표시
  return (
    <RightSidebarLoggedIn
      fallbackTeams={fallbackTeams}
      fallbackCommunity={fallbackCommunity}
    />
  );
}
