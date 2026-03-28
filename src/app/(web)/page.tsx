import type { Metadata } from "next";

// SEO: 홈 페이지 메타데이터
export const metadata: Metadata = {
  title: "MyBDR | 농구 매칭 플랫폼",
  description: "픽업 게임, 팀 대결, 대회까지 — 농구인을 위한 올인원 매칭 플랫폼",
};
import { HomeGreeting } from "@/components/home/home-greeting";
import { HeroBento } from "@/components/home/hero-bento";
import { RecommendedGames } from "@/components/home/recommended-games";
import { NotableTeams } from "@/components/home/notable-teams";
import { RecommendedVideos } from "@/components/home/recommended-videos";
import { HomeCommunity } from "@/components/home/home-community";
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
 * 1. 인사말 (로그인 시 개인화, 클라이언트에서 처리)
 * 2. 히어로 영상 슬라이드
 * 3. 추천 경기 (가로 스크롤)
 * 4. 주목할 팀 (리스트)
 * 5. 커뮤니티 (최근 게시글)
 * 6. 인기 영상
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
    /* 1열 세로 스택: 각 섹션 사이 넉넉한 간격 (mb-10 = 40px)
     * 토스 앱처럼 섹션별로 구분감 있게 배치 */
    <div className="space-y-10">

      {/* [섹션 0] 인사말(로그인) 또는 소개 히어로(비로그인) — 클라이언트에서 분기 */}
      <HomeGreeting />

      {/* [섹션 1] 히어로 영상 슬라이드 (YouTube — 프리페치 안 함) */}
      <HeroBento />

      {/* [섹션 2] 추천/인기 경기: TossSectionHeader + TossCard 가로 스크롤 */}
      <RecommendedGames fallbackData={gamesData} />

      {/* [섹션 3] 주목할만한 팀: TossListItem으로 리스트 표시 */}
      <NotableTeams fallbackData={teamsData} />

      {/* [섹션 4] 커뮤니티: 최근 게시글 TossListItem */}
      <HomeCommunity fallbackData={communityData} />

      {/* [섹션 5] 인기 영상 (YouTube — 프리페치 안 함) */}
      <RecommendedVideos />
    </div>
  );
}
