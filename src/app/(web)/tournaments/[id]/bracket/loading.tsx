// 대진표 페이지 스켈레톤 - 대시보드 레이아웃에 맞춤
// 상단: 대시보드 헤더(제목+통계 4칸) + 본문 2열(조별리그+대진표+사이드바)

import { Skeleton } from "@/components/ui/skeleton";

export default function BracketLoading() {
  return (
    <div>
      {/* 대시보드 헤더 스켈레톤 */}
      <section className="mb-10">
        {/* 제목 */}
        <div className="mb-6">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-10 w-72" />
        </div>
        {/* 통계 4칸 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`stat-${i}`} className="h-24 rounded" />
          ))}
        </div>
      </section>

      {/* 2열 레이아웃 */}
      <div className="grid grid-cols-12 gap-8">
        {/* 좌측 */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* 조별리그 스켈레톤 */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-9 w-64 rounded" />
            </div>
            <Skeleton className="h-64 rounded" />
          </section>

          {/* 대진표 스켈레톤 */}
          <div className="hidden lg:block">
            <Skeleton className="h-7 w-64 mb-8" />
            <div
              className="rounded-[16px] p-6"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-card)",
              }}
            >
              <div className="flex gap-20">
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={`r1-${i}`} className="h-[72px] w-[160px]" />
                  ))}
                </div>
                <div
                  className="flex flex-col justify-around"
                  style={{ minHeight: "368px" }}
                >
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={`r2-${i}`} className="h-[72px] w-[160px]" />
                  ))}
                </div>
                <div
                  className="flex flex-col justify-around"
                  style={{ minHeight: "368px" }}
                >
                  <Skeleton className="h-[72px] w-[160px]" />
                </div>
              </div>
            </div>
          </div>

          {/* 모바일 스켈레톤 */}
          <div className="lg:hidden">
            <div className="mb-4 flex gap-2">
              <Skeleton className="h-9 w-16 rounded-full" />
              <Skeleton className="h-9 w-14 rounded-full" />
              <Skeleton className="h-9 w-14 rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`m-${i}`} className="h-[120px] w-full rounded-[16px]" />
              ))}
            </div>
          </div>
        </div>

        {/* 우측 사이드바 스켈레톤 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Skeleton className="h-56 rounded" />
          <Skeleton className="h-52 rounded" />
          <Skeleton className="h-48 rounded" />
        </div>
      </div>
    </div>
  );
}
