import { Skeleton } from "@/components/ui/skeleton";

export default function TournamentDetailLoading() {
  return (
    <div>
      {/* 헤더 카드 */}
      <div className="mb-6 rounded-[16px] bg-white p-5 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>

      {/* 서브 탭 */}
      <div className="mb-6 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-16 rounded-full" />
        ))}
      </div>

      {/* 대회 정보 카드 */}
      <div className="mb-6 space-y-4">
        <div className="rounded-[16px] bg-white p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 경기 + 순위 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Skeleton className="mb-3 h-5 w-20" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-[16px] bg-white p-4 flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="mb-3 h-5 w-12" />
          <div className="rounded-[16px] bg-white overflow-hidden">
            <div className="border-b border-[#E8ECF0] px-4 py-2 flex gap-4">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-b border-[#F1F5F9] px-4 py-2.5 flex gap-4">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
