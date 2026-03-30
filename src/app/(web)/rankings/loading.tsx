import { Skeleton } from "@/components/ui/skeleton";

// 랭킹 페이지 로딩 스켈레톤: 테이블 형태
export default function RankingsLoading() {
  return (
    <div>
      {/* 헤더 스켈레톤 */}
      <div className="mb-8">
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* 탭 스켈레톤 */}
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-10 w-28 rounded" />
        <Skeleton className="h-10 w-28 rounded" />
      </div>

      {/* 테이블 스켈레톤 */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        {/* 테이블 헤더 */}
        <div className="px-4 py-3" style={{ backgroundColor: "var(--color-elevated)" }}>
          <Skeleton className="h-4 w-full" />
        </div>
        {/* 테이블 행 10개 */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
