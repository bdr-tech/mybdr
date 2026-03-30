import { Skeleton } from "@/components/ui/skeleton";

/**
 * 대회 상세 로딩 스켈레톤
 * - 새 디자인 (히어로 + 2열 레이아웃)에 맞춘 스켈레톤
 */
export default function TournamentDetailLoading() {
  return (
    <div>
      {/* 히어로 스켈레톤 */}
      <div
        className="relative w-full overflow-hidden"
        style={{ minHeight: "360px", backgroundColor: "var(--color-elevated)" }}
      >
        <div className="flex h-full min-h-[360px] flex-col justify-end px-6 pb-10 sm:px-10">
          {/* 배지 */}
          <div className="mb-4 flex gap-3">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-sm" />
          </div>
          {/* 대회명 */}
          <Skeleton className="mb-6 h-12 w-3/4 sm:h-16" />
          {/* 메타 정보 */}
          <div className="flex gap-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>

      {/* 2열 레이아웃 */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-10 lg:px-8">
        {/* 좌측 */}
        <div className="lg:col-span-8">
          {/* 탭 스켈레톤 */}
          <div className="mb-8 flex gap-8 border-b" style={{ borderColor: "var(--color-border)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mb-[-1px] h-5 w-14 pb-4" />
            ))}
          </div>

          {/* 대회 소개 카드 스켈레톤 */}
          <div
            className="mb-8 rounded-[var(--radius-card)] border p-6"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <Skeleton className="mb-4 h-6 w-32" />
            <Skeleton className="mb-3 h-4 w-full" />
            <Skeleton className="mb-3 h-4 w-5/6" />
            <Skeleton className="mb-6 h-4 w-4/6" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* 경기 정보 카드 스켈레톤 */}
          <div
            className="rounded-[var(--radius-card)] border p-6"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <Skeleton className="mb-4 h-6 w-24" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측 사이드바 스켈레톤 */}
        <div className="mt-8 lg:col-span-4 lg:mt-0">
          <div
            className="overflow-hidden rounded-[var(--radius-card)] border"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            {/* 참가비 헤더 */}
            <Skeleton className="h-24 w-full" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
