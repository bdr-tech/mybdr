import { Suspense } from "react";
import { TournamentsFilter } from "./tournaments-filter";
import { TournamentsContent } from "./_components/tournaments-content";
import { Skeleton } from "@/components/ui/skeleton";

// 페이지 전체 스켈레톤 (Suspense fallback용)
function PageSkeleton() {
  return (
    <div>
      {/* 헤더 스켈레톤 */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-28 rounded-[10px]" />
      </div>
      {/* 필터 스켈레톤 */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-full" />
        ))}
      </div>
      {/* 카드 그리드 스켈레톤 */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-[16px] border-l-[3px] border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * /tournaments 페이지 - 래퍼 컴포넌트
 *
 * DB 직접 호출을 제거하고, TournamentsContent 클라이언트 컴포넌트에 위임.
 * TournamentsContent가 /api/web/tournaments API를 호출하여 데이터를 가져온다.
 *
 * [변경 이유]
 * 서버 컴포넌트에서 원격 DB를 직접 호출하면 렌더링이 DB 응답을 기다리느라
 * 무한 로딩 상태에 빠지는 문제가 있었음. 클라이언트 컴포넌트 + API route 패턴으로
 * 전환하여 페이지는 즉시 렌더링되고, 데이터는 비동기로 로드됨.
 */
export default function TournamentsPage() {
  return (
    <div>
      {/* Suspense로 useSearchParams() 사용하는 클라이언트 컴포넌트 감싸기 */}
      <Suspense fallback={<PageSkeleton />}>
        <TournamentsContent TournamentsFilterComponent={TournamentsFilter} />
      </Suspense>
    </div>
  );
}
