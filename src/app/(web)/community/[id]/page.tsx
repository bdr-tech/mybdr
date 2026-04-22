import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CommentForm } from "./comment-form";
import { PostDetailSidebar } from "./_components/post-detail-sidebar";
import { ShareButton } from "./_components/share-button";
import { LikeButton } from "./_components/like-button";
import { PostActions } from "./_components/post-actions";
import { CommentList } from "./_components/comment-list";
import { getWebSession } from "@/lib/auth/web-session";
// [2026-04-22] 카페 원문 HTML entity 디코드 — Stage A 확장 후속
import { decodeHtmlEntities } from "@/lib/utils/decode-html";

export const revalidate = 30;

// React cache()로 감싸서 같은 렌더 사이클 내 중복 DB 쿼리 방지
// generateMetadata()와 본문 컴포넌트가 같은 게시글을 조회해도 실제 쿼리는 1회만 실행됨
const getPost = cache(async (publicId: string) => {
  return prisma.community_posts.findUnique({
    where: { public_id: publicId },
    include: {
      users: {
        select: {
          id: true,
          nickname: true,
          profile_image_url: true,
        },
      },
    },
  }).catch(() => null);
});

// 카페 댓글 타입
interface CafeComment {
  nickname: string;
  text: string;
  date: string;
  is_reply: boolean;
}

// images JSONB에서 카페 댓글 추출
function getCafeComments(images: unknown): CafeComment[] {
  if (!images || typeof images !== "object") return [];
  const obj = images as Record<string, unknown>;
  const comments = obj.cafe_comments;
  if (!Array.isArray(comments)) return [];
  return comments.filter((c): c is CafeComment => !!c && typeof c === "object" && "text" in c);
}

// 카테고리 라벨 매핑 (브레드크럼 표시용)
const categoryLabelMap: Record<string, string> = {
  general: "자유게시판",
  info: "정보공유",
  review: "대회후기",
  marketplace: "농구장터",
  recruit: "팀원모집",
  qna: "질문답변",
  notice: "공지사항",
};

// 상대 시간 포맷
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // cache()로 감싼 getPost를 사용 — 본문 컴포넌트와 쿼리 공유
  const post = await getPost(id);

  if (!post) return {};

  const description = post.content?.slice(0, 120) ?? "";
  return {
    title: `${post.title} - BDR 커뮤니티`,
    description,
    openGraph: {
      title: post.title,
      description,
      images: [{ url: "/images/logo.png", width: 600, height: 600, alt: "BDR" }],
    },
  };
}

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1단계: post와 session을 병렬로 조회 (서로 독립적)
  // cache()된 getPost를 사용하므로 generateMetadata와 쿼리 공유
  const [post, session] = await Promise.all([
    getPost(id),
    getWebSession(),
  ]);
  if (!post || post.status === "deleted") return notFound();

  // 카페 크롤링 글쓴이 우선, 없으면 users 테이블
  const displayNickname = post.author_nickname || post.users?.nickname || "익명";
  // 카페 댓글
  const cafeComments = getCafeComments(post.images);

  // 2단계: post.id가 필요한 댓글 + 좋아요/팔로우를 병렬 실행
  let isLiked = false;
  let isFollowing = false;
  const isLoggedIn = !!session;
  const currentUserId = session?.sub ?? undefined;
  // 본인 게시글인지 확인 (수정/삭제 버튼 표시용)
  const isPostOwner = !!session && post.user_id === BigInt(session.sub);

  // 댓글 쿼리 함수 (post.id 필요하므로 1단계 이후 실행)
  const fetchComments = () => prisma.comments.findMany({
    where: { commentable_type: "CommunityPost", commentable_id: post.id },
    orderBy: { created_at: "asc" },
    include: {
      users: {
        select: {
          nickname: true,
          profile_image_url: true,
        },
      },
    },
  });
  type CommentsResult = Awaited<ReturnType<typeof fetchComments>>;
  const commentsQuery = fetchComments().catch(() => [] as CommentsResult);

  // 로그인 시: 댓글 + 좋아요 + 팔로우를 모두 병렬 실행
  // 비로그인 시: 댓글만 조회
  let comments: CommentsResult;
  if (session) {
    const [fetchedComments, like, follow] = await Promise.all([
      commentsQuery,
      prisma.community_post_likes.findUnique({
        where: {
          community_post_id_user_id: {
            community_post_id: post.id,
            user_id: BigInt(session.sub),
          },
        },
      }).catch(() => null),
      prisma.follows.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: BigInt(session.sub),
            following_id: post.user_id,
          },
        },
      }).catch(() => null),
    ]);
    comments = fetchedComments;
    isLiked = !!like;
    isFollowing = !!follow;
  } else {
    comments = await commentsQuery;
  }

  const categoryLabel = categoryLabelMap[post.category ?? ""] ?? post.category ?? "기타";

  return (
    <div>
      {/* 브레드크럼: 커뮤니티 > 카테고리명 */}
      <nav className="flex items-center gap-2 text-xs font-medium mb-6" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/community" className="transition-colors" style={{ color: "var(--color-text-muted)" }}>
          커뮤니티
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span style={{ color: "var(--color-primary)" }}>{categoryLabel}</span>
      </nav>

      {/* 2열 레이아웃: 좌측 본문+댓글 / 우측 사이드바 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* 좌측: 본문 + 댓글 */}
        <div className="lg:col-span-8">
          {/* 게시글 본문 카드 */}
          <article
            className="rounded-lg p-4 sm:p-6 md:p-8 border overflow-hidden"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            {/* 제목 */}
            <header className="mb-6 sm:mb-8">
              <h2
                className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 leading-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                {decodeHtmlEntities(post.title)}
              </h2>

              {/* 작성자 정보 + 공유/북마크 아이콘 */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 border-b pb-6"
                style={{ borderColor: "var(--color-border)" }}
              >
                {/* 작성자 */}
                <div className="flex items-center gap-3">
                  {/* 아바타 */}
                  {post.users?.profile_image_url ? (
                    <Image
                      src={post.users.profile_image_url}
                      alt={post.users.nickname ?? ""}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {displayNickname.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {decodeHtmlEntities(displayNickname)}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 mt-1 text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span>{formatRelativeTime(post.created_at)}</span>
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: "var(--color-text-muted)" }}
                      />
                      <span>조회 {(post.view_count ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 공유/북마크/더보기 아이콘 */}
                <div className="flex items-center gap-2">
                  <ShareButton />
                  <button
                    className="p-2 transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    title="북마크 (준비 중)"
                  >
                    <span className="material-symbols-outlined">bookmark</span>
                  </button>
                  {/* 본인 게시글이면 수정/삭제 드롭다운, 아니면 빈 more_vert */}
                  {isPostOwner ? (
                    <PostActions postPublicId={id} />
                  ) : (
                    <button
                      className="p-2 transition-colors"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* 본문 */}
            <div
              className="prose prose-invert max-w-none text-sm leading-relaxed space-y-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {/* 본문을 줄바꿈 기준으로 렌더링 (카페 원문 HTML entity 디코드 후 split) */}
              {decodeHtmlEntities(post.content)?.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {/* 좋아요 버튼: 실제 동작하는 클라이언트 컴포넌트 */}
            <LikeButton
              postPublicId={id}
              initialLiked={isLiked}
              initialCount={post.likes_count ?? 0}
              isLoggedIn={isLoggedIn}
            />
          </article>

          {/* 댓글 섹션 */}
          <section
            className="mt-8 rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <div className="p-4 sm:p-6 md:p-8">
              {/* 댓글 수 헤더 (DB 댓글 + 카페 댓글 합산) */}
              <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                  댓글
                </span>
                <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                  {comments.length + cafeComments.length}
                </span>
              </div>

              {/* 댓글 입력 폼 */}
              <CommentForm postId={id} />

              {/* 댓글 리스트: DB 댓글 + 카페 댓글을 하나로 합침 */}
              <div className="mt-8">
                <CommentList
                  comments={[
                    // 카페 댓글 (크롤링 원본 — 먼저 표시, HTML entity 디코드 적용)
                    ...cafeComments.map((c, i) => ({
                      id: `cafe-${i}`,
                      userId: "",
                      content: decodeHtmlEntities(c.text),
                      likesCount: 0,
                      createdAt: c.date || "",
                      isPostAuthor: false,
                      nickname: decodeHtmlEntities(c.nickname) || "익명",
                      profileImage: null as string | null,
                      isReply: c.is_reply,
                    })),
                    // DB 댓글 (사이트에서 직접 작성)
                    ...comments
                      .filter((c) => c.status !== "deleted")
                      .map((c) => ({
                        id: c.id.toString(),
                        userId: c.user_id.toString(),
                        content: c.content,
                        likesCount: c.likes_count,
                        createdAt: c.created_at.toISOString(),
                        isPostAuthor: c.user_id === post.user_id,
                        nickname: c.users?.nickname ?? "익명",
                        profileImage: c.users?.profile_image_url ?? null,
                      })),
                  ]}
                  postPublicId={id}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </section>
        </div>

        {/* 우측: 사이드바 */}
        <div className="lg:col-span-4">
          <PostDetailSidebar
            authorId={post.user_id}
            authorNickname={displayNickname}
            authorImage={post.users?.profile_image_url ?? null}
            isFollowing={isFollowing}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}

