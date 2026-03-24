import { getWebSession } from "@/lib/auth/web-session";
import { HeroBento } from "@/components/home/hero-bento";
import { RecommendedGames } from "@/components/home/recommended-games";
import { NotableTeams } from "@/components/home/notable-teams";
import { RecommendedVideos } from "@/components/home/recommended-videos";
import { RightSidebarLoggedIn } from "@/components/home/right-sidebar-logged-in";
import { RightSidebarGuest } from "@/components/home/right-sidebar-guest";

export const revalidate = 60;

/* ============================================================
 * 홈페이지 — 3열 그리드 레이아웃
 *
 * 구조:
 * - 좌측 메인(lg:col-span-2): HeroBento → RecommendedGames → NotableTeams
 * - 우측 사이드바(lg:col-span-1): 로그인/비로그인 분기
 * - 하단 전체 너비: RecommendedVideos
 *
 * 세션 판별: getWebSession()으로 JWT 쿠키를 검증.
 * null이면 비로그인, 값이 있으면 로그인 상태.
 * ============================================================ */
export default async function HomePage() {
  /* 서버에서 세션 확인: JWT 쿠키 기반 */
  const session = await getWebSession();

  return (
    <div className="space-y-0">
      {/* === 3열 그리드: 메인 + 사이드바 === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 좌측 메인 콘텐츠: 화면의 2/3 차지 */}
        <div className="lg:col-span-2 space-y-10">
          {/* 히어로 벤토 그리드: LIVE NOW 배너 + 보조 카드 */}
          <HeroBento />

          {/* 추천/인기 경기: 로그인 시 개인화 제목, 비로그인 시 인기 경기 */}
          <RecommendedGames session={session} />

          {/* 주목할만한 팀: 4열 아바타 카드 */}
          <NotableTeams />
        </div>

        {/* 우측 사이드바: 로그인 상태에 따라 다른 위젯 */}
        <aside className="space-y-8">
          {session ? <RightSidebarLoggedIn /> : <RightSidebarGuest />}
        </aside>
      </div>

      {/* === 전체 너비: 추천 영상 === */}
      <RecommendedVideos />
    </div>
  );
}
