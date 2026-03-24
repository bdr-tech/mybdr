import { Suspense } from "react";
import { TeamsFilter } from "./teams-filter";
import { TeamsContent } from "./_components/teams-content";
import TeamsLoading from "./loading";

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
