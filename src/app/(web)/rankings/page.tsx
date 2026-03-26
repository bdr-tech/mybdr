import type { Metadata } from "next";
import { Suspense } from "react";
import { RankingsContent } from "./_components/rankings-content";
import RankingsLoading from "./loading";

// SEO: 랭킹 페이지 메타데이터
export const metadata: Metadata = {
  title: "랭킹 | MyBDR",
  description: "득점, 리바운드, 어시스트 등 부문별 선수 랭킹을 확인하세요.",
};

/**
 * /rankings 페이지
 *
 * 서버 컴포넌트는 래퍼 역할만 수행.
 * 실제 데이터 로딩은 RankingsContent (클라이언트 컴포넌트)에서
 * /api/web/rankings API를 호출하여 처리한다.
 */
export default function RankingsPage() {
  return (
    <Suspense fallback={<RankingsLoading />}>
      <RankingsContent />
    </Suspense>
  );
}
