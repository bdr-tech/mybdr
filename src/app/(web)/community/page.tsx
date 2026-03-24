import { Suspense } from "react";
import { CommunityContent } from "./_components/community-content";
import CommunityLoading from "./loading";

/**
 * /community 페이지
 *
 * 서버 컴포넌트는 래퍼 역할만 수행.
 * 실제 데이터 로딩은 CommunityContent (클라이언트 컴포넌트)에서
 * /api/web/community API를 호출하여 처리한다.
 *
 * 기존의 force-dynamic + prisma 직접 호출을 제거하여
 * 서버 렌더링 시 DB 대기로 인한 무한 로딩 문제를 해결.
 */
export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunityLoading />}>
      <CommunityContent />
    </Suspense>
  );
}
