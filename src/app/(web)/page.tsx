import { QuickMenu } from "@/components/home/quick-menu";
import { HeroSection } from "@/components/home/hero-section";
import { RecommendedVideos } from "@/components/home/recommended-videos";
import { RecommendedGames } from "@/components/home/recommended-games";

export const revalidate = 60;

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero: 로그인 시 개인 맞춤 슬라이드, 비로그인 시 정적 히어로 */}
      <HeroSection />

      {/* BDR 유튜브 추천 영상 */}
      <RecommendedVideos />

      {/* 퀵 메뉴 -- 사용자 커스텀 즐겨찾기 */}
      <QuickMenu />

      {/* 개인화 추천 경기 */}
      <RecommendedGames />
    </div>
  );
}
