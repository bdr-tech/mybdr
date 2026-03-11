import { Skeleton } from "@/components/ui/skeleton";

export default function BracketLoading() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">대진표</h1>

      {/* 데스크톱 스켈레톤 */}
      <div className="hidden lg:block">
        <div className="rounded-[16px] border border-[#E8ECF0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          {/* 라운드 헤더 */}
          <div className="mb-6 flex gap-20">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>

          {/* 매치 카드 스켈레톤 */}
          <div className="flex gap-20">
            {/* 8강 (4매치) */}
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`r1-${i}`} className="h-[72px] w-[160px]" />
              ))}
            </div>

            {/* 4강 (2매치) */}
            <div className="flex flex-col justify-around" style={{ minHeight: "368px" }}>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={`r2-${i}`} className="h-[72px] w-[160px]" />
              ))}
            </div>

            {/* 결승 (1매치) */}
            <div className="flex flex-col justify-around" style={{ minHeight: "368px" }}>
              <Skeleton className="h-[72px] w-[160px]" />
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 스켈레톤 */}
      <div className="lg:hidden">
        {/* 라운드 탭 */}
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-14 rounded-full" />
          <Skeleton className="h-9 w-14 rounded-full" />
        </div>

        {/* 카드 스켈레톤 */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`m-${i}`} className="h-[120px] w-full rounded-[16px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
