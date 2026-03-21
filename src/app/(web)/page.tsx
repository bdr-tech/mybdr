import { QuickMenu } from "@/components/home/quick-menu";
import { HeroSection } from "@/components/home/hero-section";
import { RecommendedVideos } from "@/components/home/recommended-videos";
import { RecommendedGames } from "@/components/home/recommended-games";

export const revalidate = 60;

/* ============================================================
 * 홈페이지 — bdr_6 레이아웃 기준 섹션 순서
 * 1. HeroSection (히어로 배너)
 * 2. QuickMenu (4칸 아이콘 그리드)
 * 3. RecommendedGames (벤토 그리드)
 * 4. RecommendedVideos (추천 영상)
 * ============================================================ */
export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* 히어로 배너: 로그인 시 개인 맞춤 슬라이드, 비로그인 시 대형 배너 */}
      <HeroSection />

      {/* 퀵 메뉴: bdr_6 스타일 4칸 그리드 */}
      <QuickMenu />

      {/* 개인화 추천 경기: 벤토 그리드 */}
      <RecommendedGames />

      {/* BDR 유튜브 추천 영상 */}
      <RecommendedVideos />
    </div>
  );
}
