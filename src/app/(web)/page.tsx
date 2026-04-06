import type { Metadata } from "next";

// SEO: 홈 페이지 메타데이터
export const metadata: Metadata = {
  title: "MyBDR | 농구 매칭 플랫폼",
  description: "픽업 게임, 팀 대결, 대회까지 — 농구인을 위한 올인원 매칭 플랫폼",
};
import { HomeHero } from "@/components/home/home-hero";
import { RecommendedGames } from "@/components/home/recommended-games";
import { RecommendedTournaments } from "@/components/home/recommended-tournaments";
import { NotableTeams } from "@/components/home/notable-teams";
import { RecommendedVideos } from "@/components/home/recommended-videos";
import { HomeCommunity } from "@/components/home/home-community";
import { RecentActivity } from "@/components/home/recent-activity";
import {
  prefetchTeams,
  prefetchStats,
  prefetchCommunity,
  prefetchRecommendedGames,
} from "@/lib/services/home";

/* ISR: 60초마다 재생성. getWebSession() 제거로 cookies() 호출이 없어져
 * Next.js가 이 페이지를 정적으로 캐시할 수 있다.
 * 캐시 히트 시 TTFB 50-100ms (DB 왕복 3초 -> CDN에서 즉시 응답) */
export const revalidate = 60;

/* ============================================================
 * 홈페이지 — 토스 스타일 1열 세로 스택 레이아웃
 *
 * 변경: 기존 3열 그리드(메인+사이드바) → 1열 세로 스택
 * 토스 앱처럼 "모바일 퍼스트, 한 화면에 하나의 메시지" 구조.
 *
 * 섹션 순서:
 * 0. 인사말/요약 (로그인 시 인사말+맞춤카드, 비로그인 시 소개 히어로)
 * 1. 추천 경기 (가로 스크롤)
 * 2. 주목할 팀 (리스트)
 * 3. 최근 활동 피드
 * 4. 추천 영상 (YouTube)
 * 5. 커뮤니티 (최근 게시글)
 *
 * API/데이터 패칭 로직은 기존과 100% 동일하게 유지.
 * 사이드바(HomeSidebar) import만 제거, 데이터는 다른 섹션에서 활용.
 * ============================================================ */
export default async function HomePage() {
  /* 4개 데이터를 서버에서 병렬 프리페치
   * Promise.allSettled를 사용하여 일부 실패해도 나머지는 정상 전달 */
  const [teamsResult, statsResult, communityResult, gamesResult] =
    await Promise.allSettled([
      prefetchTeams(),
      prefetchStats(),
      prefetchCommunity(),
      prefetchRecommendedGames(),
    ]);

  /* 성공한 결과만 추출, 실패하면 undefined */
  const teamsData = teamsResult.status === "fulfilled" ? teamsResult.value : undefined;
  const _statsData = statsResult.status === "fulfilled" ? statsResult.value : undefined;
  const communityData = communityResult.status === "fulfilled" ? communityResult.value : undefined;
  const gamesData = gamesResult.status === "fulfilled" ? gamesResult.value : undefined;

  return (
    /* 메인 피드: 1열 세로 스택 
     * PC(xl) 환경에서는 layout.tsx에 의해 우측에 독립적인 사이드바가 추가되므로,
     * 여기서는 전체 컴포넌트를 세로로 자연스럽게 배치합니다. */
    <div className="flex flex-col space-y-10 pb-10">
      {/* 히어로 패널 */}
      <HomeHero />

      {/* 추천/인기 경기 가로 스크롤 카드팩 */}
      <RecommendedGames fallbackData={gamesData} />

      {/* 추천 대회 */}
      <RecommendedTournaments />

      {/* 주목할 팀 (2K 스타일) */}
      <div className="xl:hidden">
        {/* xl(PC)에서는 RightSidebar에 동일한 내용이 나오므로, 중복 방지를 위해 숨깁니다. */}
        <NotableTeams fallbackData={teamsData} />
      </div>

      {/* 최근 활동 피드 */}
      <div className="xl:hidden">
        {/* xl(PC)에서는 RightSidebar에 반영되므로 숨김 */}
        <RecentActivity />
      </div>

      {/* 미디어 / 하이라이트 영상 */}
      <RecommendedVideos />

      {/* 커뮤니티 게시글 최신 요약 */}
      <HomeCommunity fallbackData={communityData} />
    </div>
  );
}
