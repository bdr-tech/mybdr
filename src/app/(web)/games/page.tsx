import type { Metadata } from "next";
import { Suspense } from "react";
import { GamesFilter } from "./games-filter";
import { GamesContent } from "./_components/games-content";
import { Skeleton } from "@/components/ui/skeleton";

// SEO: 경기 목록 페이지 메타데이터
export const metadata: Metadata = {
  title: "경기 찾기 | MyBDR",
  description: "내 주변 픽업 게임, 게스트 모집, 팀 대결을 찾아보세요.",
};

// 페이지 전체 스켈레톤 - 새 디자인(이미지 카드 3열)에 맞춘 로딩 상태
function PageSkeleton() {
  return (
    <div>
      {/* 헤더 스켈레톤: "Game Finder" 제목 + 버튼들 */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* 필터 바 스켈레톤 */}
      <div className="mb-6 space-y-4">
        <Skeleton className="h-10 w-full rounded-full" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-36 rounded" />
          <Skeleton className="h-10 w-36 rounded" />
          <Skeleton className="h-10 w-36 rounded" />
          <Skeleton className="h-10 w-36 rounded" />
          <Skeleton className="h-10 w-28 rounded ml-auto" />
        </div>
      </div>

      {/* "Available Games" 스켈레톤 */}
      <div className="mb-6">
        <Skeleton className="h-7 w-52" />
      </div>

      {/* 카드 그리드 스켈레톤: 이미지 + 정보 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * /games 페이지 - 래퍼 컴포넌트
 *
 * DB 직접 호출을 제거하고, GamesContent 클라이언트 컴포넌트에 위임.
 * GamesContent가 /api/web/games API를 호출하여 데이터를 가져온다.
 */
export default function GamesPage() {
  return (
    <div>
      {/* Suspense로 useSearchParams() 사용하는 클라이언트 컴포넌트 감싸기 */}
      <Suspense fallback={<PageSkeleton />}>
        <GamesContent GamesFilterComponent={GamesFilter} />
      </Suspense>
    </div>
  );
}
