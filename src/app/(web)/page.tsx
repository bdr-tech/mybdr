import type { Metadata } from "next";
import { getWebSession } from "@/lib/auth/web-session";

// SEO: 홈 페이지 메타데이터
export const metadata: Metadata = {
  title: "MyBDR | 농구 매칭 플랫폼",
  description: "픽업 게임, 팀 대결, 대회까지 — 농구인을 위한 올인원 매칭 플랫폼",
};
import { HeroBento } from "@/components/home/hero-bento";
import { RecommendedGames } from "@/components/home/recommended-games";
import { NotableTeams } from "@/components/home/notable-teams";
import { RecommendedVideos } from "@/components/home/recommended-videos";
import { RightSidebarLoggedIn } from "@/components/home/right-sidebar-logged-in";
import { RightSidebarGuest } from "@/components/home/right-sidebar-guest";
import {
  prefetchTeams,
  prefetchStats,
  prefetchCommunity,
  prefetchRecommendedGames,
} from "@/lib/services/home";

export const revalidate = 60;

/* ============================================================
 * 홈페이지 — 3열 그리드 레이아웃 + 서버 프리페치
 *
 * 서버 프리페치란:
 * 서버에서 미리 DB 데이터를 가져와 클라이언트 컴포넌트에 초기값으로 전달.
 * 이러면 화면이 로딩 없이 즉시 표시되고, SWR이 백그라운드에서 최신 데이터를 갱신.
 *
 * 프리페치 대상 (내부 DB만, 빠르게 조회 가능):
 * 1. teams — 주목 팀 + 사이드바 랭킹
 * 2. stats — 플랫폼 통계 (비로그인 사이드바)
 * 3. community — 최근 게시글 (사이드바)
 * 4. recommended-games — 추천 경기
 *
 * 프리페치 제외 (기존 SWR 유지):
 * - YouTube (외부 API라 서버 응답 느려짐)
 * - profile/stats (로그인 시에만, 복잡도 대비 효과 작음)
 * ============================================================ */
export default async function HomePage() {
  /* 서버에서 세션 확인: JWT 쿠키 기반 */
  const session = await getWebSession();

  /* 4개 데이터를 서버에서 병렬 프리페치
   * Promise.allSettled를 사용하여 일부 실패해도 나머지는 정상 전달
   * (하나의 DB 쿼리 실패가 페이지 전체를 깨뜨리면 안 되므로) */
  const [teamsResult, statsResult, communityResult, gamesResult] =
    await Promise.allSettled([
      prefetchTeams(),
      prefetchStats(),
      prefetchCommunity(),
      prefetchRecommendedGames(session?.sub),
    ]);

  /* 성공한 결과만 추출, 실패하면 undefined (컴포넌트가 기존처럼 SWR로 직접 요청) */
  const teamsData = teamsResult.status === "fulfilled" ? teamsResult.value : undefined;
  const statsData = statsResult.status === "fulfilled" ? statsResult.value : undefined;
  const communityData = communityResult.status === "fulfilled" ? communityResult.value : undefined;
  const gamesData = gamesResult.status === "fulfilled" ? gamesResult.value : undefined;

  return (
    <div className="space-y-0">
      {/* === 3열 그리드: 메인 + 사이드바 === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 좌측 메인 콘텐츠: 화면의 2/3 차지 */}
        <div className="lg:col-span-2 space-y-10">
          {/* 히어로 벤토 그리드: LIVE NOW 배너 + 보조 카드 (YouTube — 프리페치 안 함) */}
          <HeroBento />

          {/* 추천/인기 경기: fallbackData로 즉시 렌더링, SWR이 뒤에서 갱신 */}
          <RecommendedGames session={session} fallbackData={gamesData} />

          {/* 주목할만한 팀: fallbackData로 즉시 렌더링 */}
          <NotableTeams fallbackData={teamsData} />
        </div>

        {/* 우측 사이드바: 로그인 상태에 따라 다른 위젯 */}
        <aside className="space-y-8">
          {session ? (
            <RightSidebarLoggedIn
              fallbackTeams={teamsData}
              fallbackCommunity={communityData}
            />
          ) : (
            <RightSidebarGuest
              fallbackTeams={teamsData}
              fallbackCommunity={communityData}
              fallbackStats={statsData}
            />
          )}
        </aside>
      </div>

      {/* === 전체 너비: 추천 영상 (YouTube — 프리페치 안 함) === */}
      <RecommendedVideos />
    </div>
  );
}
