import { Skeleton } from "@/components/ui/skeleton";

// 팀 목록 로딩 스켈레톤: 새 디자인 4열 카드 형태
export default function TeamsLoading() {
  return (
    <div>
      {/* 헤더 스켈레톤 */}
      <div className="mb-10">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* 필터 스켈레톤 */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-64 rounded" />
        <Skeleton className="h-9 w-24 rounded" />
      </div>

      {/* 4열 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border overflow-hidden"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            {/* 배너 영역 */}
            <Skeleton className="h-24 w-full rounded-none" />
            <div className="px-6 pb-6 pt-4 space-y-4">
              {/* 팀 아이콘 */}
              <div className="flex justify-center -mt-12">
                <Skeleton className="h-16 w-16 rounded-md" />
              </div>
              {/* 팀명 + 지역 */}
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-5 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              {/* 통계 */}
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-12 rounded" />
                <Skeleton className="h-12 rounded" />
                <Skeleton className="h-12 rounded" />
              </div>
              {/* 버튼 */}
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
