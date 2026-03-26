import type { Metadata } from "next";
import { Suspense } from "react";
import { CommunityContent } from "./_components/community-content";
import CommunityLoading from "./loading";

// SEO: 커뮤니티 페이지 메타데이터
export const metadata: Metadata = {
  title: "커뮤니티 | MyBDR",
  description: "농구 이야기를 나누고, 팀원을 모집하고, 정보를 공유하세요.",
};

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
