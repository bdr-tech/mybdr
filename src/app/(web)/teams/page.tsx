import type { Metadata } from "next";
import { Suspense } from "react";
import { TeamsFilter } from "./teams-filter";
import { TeamsContent } from "./_components/teams-content";
import TeamsLoading from "./loading";

// SEO: 팀 디렉토리 페이지 메타데이터
export const metadata: Metadata = {
  title: "팀 디렉토리 | MyBDR",
  description: "활동 중인 농구 팀을 찾고 가입 신청하세요.",
};

/**
 * /teams 페이지
 *
 * 서버 컴포넌트는 래퍼 역할만 수행.
 * 실제 데이터 로딩은 TeamsContent (클라이언트 컴포넌트)에서
 * /api/web/teams API를 호출하여 처리한다.
 */
export default function TeamsPage() {
  return (
    <Suspense fallback={<TeamsLoading />}>
      <TeamsContent TeamsFilterComponent={TeamsFilter} />
    </Suspense>
  );
}
