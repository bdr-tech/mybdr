import { Skeleton } from "@/components/ui/skeleton";

/**
 * CommunityLoading - 커뮤니티 목록 로딩 스켈레톤
 * 2열 레이아웃: 좌측 게시글 카드 + 우측 사이드바
 */
export default function CommunityLoading() {
  return (
    <div>
      {/* 제목 스켈레톤 */}
      <Skeleton className="h-9 w-32 mb-6 rounded" />

      {/* 카테고리 탭 스켈레톤 */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>

      {/* 2열 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 좌측: 게시글 리스트 스켈레톤 */}
        <div className="lg:col-span-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border p-5"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded mb-2" />
              <Skeleton className="h-4 w-full rounded mb-1" />
              <Skeleton className="h-4 w-2/3 rounded mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16 rounded" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-12 rounded" />
                  <Skeleton className="h-3 w-12 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 우측: 사이드바 스켈레톤 */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className="rounded-lg border p-6"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <Skeleton className="h-5 w-32 mb-4 rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 mb-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-full rounded" />
              </div>
            ))}
          </div>
          <div
            className="rounded-lg border p-6"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <Skeleton className="h-5 w-28 mb-4 rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mb-3">
                <Skeleton className="h-3 w-24 rounded mb-1" />
                <Skeleton className="h-4 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
