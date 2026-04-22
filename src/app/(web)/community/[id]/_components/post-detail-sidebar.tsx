import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { FollowButton } from "@/components/follow-button";
// [2026-04-22] 카페 원문 HTML entity 디코드 — Stage A 확장 후속
import { decodeHtmlEntities } from "@/lib/utils/decode-html";

// 카테고리 라벨 매핑
const categoryLabelMap: Record<string, string> = {
  general: "자유게시판",
  info: "정보공유",
  review: "대회후기",
  marketplace: "농구장터",
  recruit: "팀원모집",
  qna: "질문답변",
  notice: "공지사항",
};

interface PostDetailSidebarProps {
  authorId: bigint;            // 작성자 ID (게시글 수 조회용)
  authorNickname: string;      // 작성자 닉네임
  authorImage: string | null;  // 작성자 프로필 이미지
  isFollowing: boolean;        // 현재 유저가 작성자를 팔로우 중인지
  isLoggedIn: boolean;         // 로그인 여부
  currentUserId?: string;      // 현재 로그인 유저 ID (자기 게시글이면 팔로우 버튼 숨김)
}

/**
 * PostDetailSidebar - 게시글 상세 우측 사이드바 (서버 컴포넌트)
 *
 * 시안(bdr_1/bdr_3) 기반:
 * 1. 작성자 정보 카드 (아바타 + 이름 + 게시글 수 + 팔로우 버튼)
 * 2. 실시간 인기글 리스트
 * 3. 이벤트 배너 (placeholder)
 */
export async function PostDetailSidebar({
  authorId,
  authorNickname,
  authorImage,
  isFollowing,
  isLoggedIn,
  currentUserId,
}: PostDetailSidebarProps) {
  // 자기 자신 게시글이면 팔로우 버튼 숨김
  const isOwnPost = currentUserId ? BigInt(currentUserId) === authorId : false;
  // 작성자의 게시글 수 조회
  const authorPostCount = await prisma.community_posts.count({
    where: { user_id: authorId },
  }).catch(() => 0);

  // 작성자의 댓글 수 조회
  const authorCommentCount = await prisma.comments.count({
    where: { user_id: authorId },
  }).catch(() => 0);

  // 실시간 인기글: 최근 게시글 중 조회수 높은 것 3개
  const trendingPosts = await prisma.community_posts.findMany({
    orderBy: { view_count: "desc" },
    take: 3,
    select: {
      public_id: true,
      title: true,
      category: true,
    },
  }).catch(() => []);

  return (
    <aside className="space-y-6">
      {/* 작성자 정보 카드 */}
      <div
        className="rounded-lg border p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h3
          className="text-sm font-bold mb-4 uppercase tracking-wider opacity-60"
          style={{ color: "var(--color-text-primary)" }}
        >
          작성자 정보
        </h3>

        {/* 아바타 + 닉네임 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {authorImage ? (
              <img
                src={authorImage}
                alt={authorNickname}
                className="w-16 h-16 rounded-full object-cover border-2"
                style={{ borderColor: "var(--color-border)" }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {authorNickname.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <span
              className="block text-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {decodeHtmlEntities(authorNickname)}
            </span>
          </div>
        </div>

        {/* 통계: 작성글 / 작성댓글 */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div
            className="p-3 rounded"
            style={{ backgroundColor: "var(--color-elevated)" }}
          >
            <span
              className="block text-xs uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              작성글
            </span>
            <span
              className="block text-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {authorPostCount}
            </span>
          </div>
          <div
            className="p-3 rounded"
            style={{ backgroundColor: "var(--color-elevated)" }}
          >
            <span
              className="block text-xs uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              작성댓글
            </span>
            <span
              className="block text-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {authorCommentCount}
            </span>
          </div>
        </div>

        {/* 팔로우 버튼: 자기 게시글이 아닐 때만 표시 */}
        {!isOwnPost && (
          <FollowButton
            targetUserId={authorId.toString()}
            initialFollowed={isFollowing}
            isLoggedIn={isLoggedIn}
            variant="outline"
          />
        )}
      </div>

      {/* 실시간 인기글 */}
      <div
        className="rounded-lg border p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h3
          className="text-sm font-bold mb-4 uppercase tracking-wider opacity-60"
          style={{ color: "var(--color-text-primary)" }}
        >
          실시간 인기글
        </h3>
        <div className="space-y-4">
          {trendingPosts.map((tp) => (
            <Link
              key={tp.public_id}
              href={`/community/${tp.public_id}`}
              className="group block"
            >
              <span
                className="text-xs mb-1 block"
                style={{ color: "var(--color-text-muted)" }}
              >
                커뮤니티 &gt; {categoryLabelMap[tp.category ?? ""] ?? "기타"}
              </span>
              <p
                className="text-sm transition-colors line-clamp-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {decodeHtmlEntities(tp.title)}
              </p>
            </Link>
          ))}

          {trendingPosts.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              아직 게시글이 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* 이벤트 배너 (placeholder) */}
      <div
        className="relative rounded-lg aspect-[3/4] overflow-hidden flex flex-col justify-end p-6"
        style={{ backgroundColor: "var(--color-elevated)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
          }}
        />
        <div className="relative z-10">
          <span
            className="text-xs font-bold px-2 py-1 rounded w-fit mb-3 inline-block"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            HOT EVENT
          </span>
          <h4
            className="text-xl font-bold mb-2 leading-tight"
            style={{ color: "var(--color-on-primary)" }}
          >
            BDR 3x3 아마추어 챔피언십 모집
          </h4>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            지금 바로 팀을 구성하고 우승 상금에 도전하세요!
          </p>
          <button
            className="py-2 px-4 rounded text-xs font-bold uppercase transition-colors"
            style={{ backgroundColor: "var(--color-on-primary)", color: "var(--color-text-primary)" }}
          >
            View Detail
          </button>
        </div>
      </div>
    </aside>
  );
}
