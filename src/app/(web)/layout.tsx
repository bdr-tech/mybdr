import { Header } from "@/components/shared/header";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider } from "@/contexts/prefer-filter-context";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      {/* PreferFilterProvider: 전역 선호 필터 상태를 (web) 레이아웃 전체에 공유 */}
      <PreferFilterProvider>
        {/* 배경색: CSS 변수 (Kinetic Pulse surface) */}
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
          <Header />
          {/* pt-[80px]: fixed 헤더(h-16=64px) 아래로 본문이 가려지지 않도록 상단 여백 추가 */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-[80px] lg:pb-6">
            {children}
          </main>
          <div className="footer-mobile-space">
            <Footer />
          </div>
        </div>
      </PreferFilterProvider>
    </SWRProvider>
  );
}
