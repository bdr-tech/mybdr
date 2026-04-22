import type { Metadata } from "next";
import { Suspense } from "react";
import { CommunityContent } from "./_components/community-content";
import CommunityLoading from "./loading";
import { prefetchCommunity } from "@/lib/services/home";

// SEO: 커뮤니티 페이지 메타데이터
export const metadata: Metadata = {
  title: "커뮤니티 | MyBDR",
  description: "농구 이야기를 나누고, 팀원을 모집하고, 정보를 공유하세요.",
};

// 60초 캐시: 홈 페이지와 동일한 revalidate 설정
export const revalidate = 60;

/**
 * /community 페이지 — 서버 프리페치 패턴
 *
 * 기존: 빈 HTML 전송 후 클라이언트에서 fetch (폭포수 패턴, 체감 느림)
 * 개선: 서버에서 DB 직접 조회 -> fallbackPosts로 전달 -> 즉시 렌더링
 *       카테고리 변경/검색 시에는 기존대로 클라이언트 API fetch
 *
 * 패턴 참고: src/app/(web)/page.tsx의 prefetchCommunity -> NotableTeams 전달 방식
 */
export default async function CommunityPage() {
  // 서버에서 기본 게시글 목록 프리페치 (카테고리=전체, 검색=없음)
  // 실패해도 undefined → 클라이언트가 기존대로 API fetch
  let fallbackData: Awaited<ReturnType<typeof prefetchCommunity>> | undefined;
  try {
    fallbackData = await prefetchCommunity();
  } catch {
    fallbackData = undefined;
  }

  // 프리페치 결과의 public_id는 string|null이지만, 클라이언트 PostFromApi는 string을 기대한다.
  // null인 경우 빈 문자열로 폴백하여 타입을 맞춘다 (public_id가 없는 게시글은 라우팅 불가 → 빈 값이 적절).
  const normalizedPosts = fallbackData?.posts.map((p) => ({
    ...p,
    public_id: p.public_id ?? "",
  }));

  return (
    <Suspense fallback={<CommunityLoading />}>
      <CommunityContent fallbackPosts={normalizedPosts} />
    </Suspense>
  );
}
