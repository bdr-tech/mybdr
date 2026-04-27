import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CommentForm } from "./comment-form";
import { PostDetailSidebar } from "./_components/post-detail-sidebar";
// v2 박제: 기존 ShareButton/LikeButton 대신 시안 .btn.btn--lg 모양의 v2 버튼 사용
// 데이터 로직(Server Action / 클립보드)은 v1 과 100% 동일 — UI 만 교체
import { ShareButtonV2 } from "./_components/share-button-v2";
import { LikeButtonV2 } from "./_components/like-button-v2";
import { PostActions } from "./_components/post-actions";
import { CommentList } from "./_components/comment-list";
import { CommunityAsideNav } from "../_components/community-aside-nav";
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

// 카페 댓글 타입 (images JSONB 안에 cafe_comments 배열로 저장됨)
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

// 카테고리 라벨 매핑 (브레드크럼 + badge--soft 표시용)
const categoryLabelMap: Record<string, string> = {
  general: "자유게시판",
  info: "정보공유",
  review: "대회후기",
  marketplace: "농구장터",
  recruit: "팀원모집",
  qna: "질문답변",
  notice: "공지사항",
};

// 상대 시간 포맷 (시안은 "2025.04.22" 형식이지만 운영 일관성 위해 기존 상대시간 유지)
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

  const categoryKey = post.category ?? "";
  const categoryLabel = categoryLabelMap[categoryKey] ?? categoryKey ?? "기타";
  // DB 댓글 + 카페 댓글 합산 (시안 헤더 카운트 + 본문 헤더 메타에서 사용)
  const totalCommentsCount = comments.filter((c) => c.status !== "deleted").length + cafeComments.length;
  // 좋아요 / 조회수 — null 방어
  const likesCount = post.likes_count ?? 0;
  const viewsCount = post.view_count ?? 0;

  return (
    // 시안 .page > .with-aside (좌 CommunityAside + 우 main) — BoardList 와 동일 레이아웃
    <div className="page">
      <div className="with-aside">
        {/* 좌측: 게시판 그룹 트리 (BoardList 와 동일 컴포넌트 재사용)
            PostDetail 에는 활성 카테고리 개념이 없으므로 "전체글" 활성. 항목 클릭 시 /community 로 이동 */}
        <CommunityAsideNav activeCategory={null} />

        <main>
          {/* 1. 브레드크럼 — 시안 그대로 (홈 › 카테고리 › 글 상세) */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--ink-mute)",
              marginBottom: 10,
              whiteSpace: "nowrap",
              flexWrap: "wrap",
            }}
          >
            <Link href="/" style={{ color: "var(--ink-mute)" }}>홈</Link>
            <span>›</span>
            {/* 카테고리 → /community?category=... 이동 */}
            <Link
              href={categoryKey ? `/community?category=${categoryKey}` : "/community"}
              style={{ color: "var(--ink-mute)" }}
            >
              {categoryLabel}
            </Link>
            <span>›</span>
            <span style={{ color: "var(--ink)" }}>글 상세</span>
          </nav>

          {/* 2. 본문 카드 — 시안 .card padding:0 + 헤더/Body/Reactions/Nav 4섹션 */}
          <article className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* 2-1. 헤더 — badge--soft + 제목 + 작성자/메타 */}
            <header style={{ padding: "22px 26px 18px", borderBottom: "1px solid var(--border)" }}>
              {/* 카테고리 배지 (시안 badge--soft) */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <span className="badge badge--soft">{categoryLabel}</span>
              </div>
              {/* 제목 — 시안 24px / 700 / lh 1.3 */}
              <h1
                style={{
                  margin: "0 0 14px",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.3,
                  color: "var(--ink)",
                }}
              >
                {decodeHtmlEntities(post.title)}
              </h1>

              {/* 작성자 + 메타 (시안 좌: 작성자 우: 날짜·조회·댓글·좋아요) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  color: "var(--ink-mute)",
                  flexWrap: "wrap",
                }}
              >
                {/* 작성자 박스 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {post.users?.profile_image_url ? (
                    <Image
                      src={post.users.profile_image_url}
                      alt={post.users.nickname ?? ""}
                      width={32}
                      height={32}
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    // 시안 패턴: cafe-blue 톤 이니셜 박스
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--cafe-blue-soft)",
                        color: "var(--cafe-blue-deep)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {displayNickname.charAt(0)}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
                      <b style={{ color: "var(--ink)" }}>{decodeHtmlEntities(displayNickname)}</b>
                      {/* LevelBadge 자리 — DB users.xp 기반 등급 미구현. 추후 구현 목록에 기록 */}
                    </div>
                    {/* 작성글 수: 시안에 있지만 사이드바 PostDetailSidebar 에 이미 노출되므로 여기는 시각적 부담 줄여 생략 */}
                  </div>
                </div>

                {/* 우측 메타 — flex:1 spacer 후 우정렬
                    시안: Icon.eye / Icon.msg / Icon.heart Material Symbols 로 박제 */}
                <span style={{ flex: 1 }} />
                <span>{formatRelativeTime(post.created_at)}</span>
                <span>·</span>
                <span title="조회수" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: -3 }}>
                    visibility
                  </span>
                  {viewsCount.toLocaleString()}
                </span>
                <span>·</span>
                <span title="댓글수" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: -3 }}>
                    chat_bubble
                  </span>
                  {totalCommentsCount}
                </span>
                <span>·</span>
                <span title="좋아요수" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: -3 }}>
                    favorite
                  </span>
                  {likesCount}
                </span>

                {/* 본인 게시글이면 수정/삭제 드롭다운만 추가 (시안에는 없지만 운영 필수) */}
                {isPostOwner && (
                  <span style={{ marginLeft: 4 }}>
                    <PostActions postPublicId={id} />
                  </span>
                )}
              </div>
            </header>

            {/* 2-2. Body — 시안 padding 28px 26px / fs 15 / lh 1.8 / color ink-soft.
                   D3 결정: DB가 block type 미지원 → 줄바꿈 split <p> 그대로 (h3/img 미적용) */}
            <div
              style={{
                padding: "28px 26px",
                fontSize: 15,
                lineHeight: 1.8,
                color: "var(--ink-soft)",
              }}
            >
              {decodeHtmlEntities(post.content)?.split("\n").map((line, i) => (
                <p key={i} style={{ margin: "0 0 14px" }}>{line}</p>
              ))}
            </div>

            {/* 2-3. Reactions — 시안 좋아요/공유/스크랩 3버튼 가로 정렬 (.btn.btn--lg 통일)
                   v2 박제: LikeButtonV2 + ShareButtonV2 (데이터 로직은 기존과 100% 동일, UI 만 시안 박제)
                   스크랩은 DB 미지원 → disabled "준비 중" 유지 */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                padding: "18px 26px",
                borderTop: "1px solid var(--border)",
                flexWrap: "wrap",
              }}
            >
              {/* 좋아요 — v2 박제 (시안 .btn.btn--lg minWidth:140) */}
              <LikeButtonV2
                postPublicId={id}
                initialLiked={isLiked}
                initialCount={likesCount}
                isLoggedIn={isLoggedIn}
              />
              {/* 공유 — v2 박제 (시안 .btn.btn--lg) */}
              <ShareButtonV2 />
              {/* 스크랩 — 시안에 있으나 DB 미지원 → disabled "준비 중" (.btn.btn--lg 톤 통일) */}
              <button
                disabled
                title="스크랩 준비 중"
                className="btn btn--lg"
                style={{ cursor: "not-allowed", opacity: 0.55 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, verticalAlign: -3, marginRight: 6 }}
                >
                  bookmark
                </span>
                스크랩
              </button>
            </div>

            {/* 2-4. Nav — 시안 이전/다음 글 (D4 결정: DB 쿼리 추가 X → placeholder "준비 중") */}
            <div style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
              <div
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  borderRight: "1px solid var(--border)",
                  fontSize: 13,
                  color: "var(--ink-dim)",
                }}
                title="준비 중"
              >
                ← 이전글: 준비 중
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  fontSize: 13,
                  color: "var(--ink-dim)",
                  textAlign: "right",
                }}
                title="준비 중"
              >
                다음글: 준비 중 →
              </div>
            </div>
          </article>

          {/* 3. 댓글 섹션 — 시안 헤더(댓글 + accent N) + CommentForm + CommentList */}
          <section style={{ marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>댓글</h3>
              <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 16 }}>
                {totalCommentsCount}
              </span>
            </div>

            {/* 댓글 입력 — 기존 컴포넌트 그대로 (D6) */}
            <CommentForm postId={id} />

            {/* 댓글 리스트 — DB 댓글 + 카페 댓글 합쳐서 한 번에 (D7) */}
            <div style={{ marginTop: 24 }}>
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
          </section>

          {/* 4. 본문 하단 누적 사이드 항목들 (D1-c)
                 — 기존 PostDetailSidebar 컴포넌트 그대로 호출. 기존 grid 12열 우측 컬럼이 아니라
                   main 안에서 1열 누적 형태로 노출. 작성자 카드 / 실시간 인기글 / 이벤트 배너 3블록 */}
          <div style={{ marginTop: 32 }}>
            <PostDetailSidebar
              authorId={post.user_id}
              authorNickname={displayNickname}
              authorImage={post.users?.profile_image_url ?? null}
              isFollowing={isFollowing}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
