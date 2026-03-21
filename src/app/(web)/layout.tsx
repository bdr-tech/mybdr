import { Header } from "@/components/shared/header";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider } from "@/contexts/prefer-filter-context";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      {/* PreferFilterProvider: 전역 선호 필터 상태를 (web) 레이아웃 전체에 공유 */}
      <PreferFilterProvider>
        {/* 배경색: 하드코딩 #F5F7FA -> CSS 변수 (다크 모드 자동 대응) */}
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 lg:pb-6">
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
