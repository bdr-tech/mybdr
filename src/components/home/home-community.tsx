"use client";

/* ============================================================
 * HomeCommunity — 홈 페이지 커뮤니티 섹션 (토스 스타일)
 *
 * 기존 사이드바(RightSidebarGuest/LoggedIn)에 있던 커뮤니티 미리보기를
 * 독립 컴포넌트로 분리하여 1열 레이아웃 메인 영역에 배치.
 *
 * TossSectionHeader + TossListItem 조합으로 토스 앱 스타일 구현.
 * API/데이터 패칭은 기존과 동일 (/api/web/community).
 * ============================================================ */

import useSWR from "swr";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
import { TossListItem } from "@/components/toss/toss-list-item";

/* API 응답의 게시글 타입 (snake_case) */
interface PostData {
  id: string;
  public_id: string | null;
  title: string;
  view_count: number;
  created_at: string | null;
}

/* API 실패 시 표시할 fallback 데이터 */
const FALLBACK_POSTS: PostData[] = [
  { id: "1", public_id: null, title: "이번 윈터 챌린지 룰 변경사항 있나요?", view_count: 120, created_at: null },
  { id: "2", public_id: null, title: "Storm FC 팀원 모집합니다 (수비수)", view_count: 90, created_at: null },
  { id: "3", public_id: null, title: "초보자를 위한 경기 운영 팁 5가지", view_count: 85, created_at: null },
];

interface HomeCommunityProps {
  fallbackData?: { posts: PostData[] };
}

export function HomeCommunity({ fallbackData }: HomeCommunityProps) {
  /* SWR로 커뮤니티 API 호출 (서버 프리페치 데이터 활용) */
  const { data } = useSWR<{ posts: PostData[] }>(
    "/api/web/community",
    null,
    { fallbackData, revalidateOnMount: !fallbackData }
  );

  /* API 응답에서 최신글 4개 추출, 없으면 fallback */
  const posts: PostData[] = (() => {
    const apiPosts = data?.posts;
    return apiPosts && apiPosts.length > 0 ? apiPosts.slice(0, 4) : FALLBACK_POSTS;
  })();

  /* 조회수를 읽기 쉬운 형식으로 변환 */
  const formatViews = (count: number): string => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <section>
      {/* 토스 스타일 섹션 헤더: "커뮤니티" + "전체보기 >" */}
      <TossSectionHeader title="커뮤니티" actionHref="/community" />

      {/* 게시글 리스트: TossListItem으로 통일 */}
      <div>
        {posts.map((post) => (
          <TossListItem
            key={post.id}
            icon="forum"
            iconBg="var(--color-text-tertiary)"
            title={post.title}
            subtitle={`조회 ${formatViews(post.view_count)}`}
            href={`/community/${post.public_id || post.id}`}
            showArrow={true}
          />
        ))}
      </div>
    </section>
  );
}
