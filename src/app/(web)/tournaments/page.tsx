import type { Metadata } from "next";
import { Suspense } from "react";
import { TournamentsFilter } from "./tournaments-filter";
import { TournamentsContent } from "./_components/tournaments-content";
import { Skeleton } from "@/components/ui/skeleton";

// SEO: 대회 목록 페이지 메타데이터
export const metadata: Metadata = {
  title: "대회 찾기 | MyBDR",
  description: "참가 가능한 농구 대회를 찾고 팀을 등록하세요.",
};

// 페이지 전체 스켈레톤 (Suspense fallback용) - 새 디자인에 맞춤
function PageSkeleton() {
  return (
    <div>
      {/* 헤더 스켈레톤: "TOURNAMENT DIRECTORY" 대형 제목 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-12 w-80" />
        </div>
        {/* 필터 드롭다운 스켈레톤 */}
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
        {Array.from({ length: 6 }).map((_, i) => (
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
