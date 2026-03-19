import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-4">
      {/* 프로필 헤더 */}
      <div className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-[72px] w-[72px] flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24 rounded-[10px]" />
        </div>
      </div>

      {/* 활동 요약 */}
      <div className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5">
        <Skeleton className="mb-4 h-5 w-20" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-28 w-28 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* 내 기록 */}
      <div className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5">
        <Skeleton className="mb-4 h-5 w-16" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>

      {/* 리스트 섹션 x3 */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5">
          <Skeleton className="mb-3 h-5 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-[12px]" />
            <Skeleton className="h-10 w-full rounded-[12px]" />
            <Skeleton className="h-10 w-full rounded-[12px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
