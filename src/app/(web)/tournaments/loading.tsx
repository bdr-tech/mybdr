import { Skeleton } from "@/components/ui/skeleton";

// 라우트 전환 시 표시되는 스켈레톤 (새 디자인: 이미지 배너 카드형)
export default function TournamentsLoading() {
  return (
    <div>
      {/* 헤더 스켈레톤: "TOURNAMENT DIRECTORY" 대형 제목 + 필터 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-12 w-80" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28 rounded" />
          <Skeleton className="h-10 w-28 rounded" />
          <Skeleton className="h-10 w-28 rounded" />
          <Skeleton className="h-10 w-48 rounded" />
          <Skeleton className="h-10 w-10 rounded" />
        </div>
      </div>
      {/* 카드 그리드 스켈레톤: 3열 이미지 배너 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded overflow-hidden"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <Skeleton className="h-48 w-full" />
            <div className="p-6 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
