import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CommentForm } from "./comment-form";
import { PostDetailSidebar } from "./_components/post-detail-sidebar";
import { ShareButton } from "./_components/share-button";

export const revalidate = 30;

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
  const post = await prisma.community_posts.findUnique({
    where: { public_id: id },
    select: { title: true, content: true },
  }).catch(() => null);

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

  // 게시글 조회: 작성자 프로필 이미지도 함께 가져옴
  const post = await prisma.community_posts.findUnique({
    where: { public_id: id },
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
  if (!post) return notFound();

  // 댓글 조회: 작성자 프로필 이미지 포함
  const comments = await prisma.comments.findMany({
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
  }).catch(() => []);

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 좌측: 본문 + 댓글 */}
        <div className="lg:col-span-8">
          {/* 게시글 본문 카드 */}
          <article
            className="rounded-lg p-6 md:p-8 border overflow-hidden"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            {/* 제목 */}
            <header className="mb-8">
              <h2
                className="text-2xl md:text-3xl font-bold mb-6 leading-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                {post.title}
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
                    <img
                      src={post.users.profile_image_url}
                      alt={post.users.nickname ?? ""}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {(post.users?.nickname ?? "?").charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {post.users?.nickname ?? "익명"}
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
                  <button
                    className="p-2 transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </div>
            </header>

            {/* 본문 */}
            <div
              className="prose prose-invert max-w-none text-sm leading-relaxed space-y-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {/* 본문을 줄바꿈 기준으로 렌더링 */}
              {post.content?.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {/* 좋아요 버튼 (UI만 배치, 기능 미구현) */}
            <div
              className="flex flex-col items-center mt-12 pt-8 border-t"
              style={{ borderColor: "var(--color-border)" }}
            >
              <button className="group flex flex-col items-center gap-2 mb-8" title="추천 기능은 준비 중입니다">
                <div
                  className="w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                  style={{
                    borderColor: "var(--color-primary)",
                    color: "var(--color-primary)",
                  }}
                >
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    thumb_up
                  </span>
                </div>
                <span className="font-bold text-lg" style={{ color: "var(--color-primary)" }}>
                  0
                </span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  추천하기
                </span>
              </button>
            </div>
          </article>

          {/* 댓글 섹션 */}
          <section
            className="mt-8 rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <div className="p-6 md:p-8">
              {/* 댓글 수 헤더 */}
              <div className="flex items-center gap-2 mb-8">
                <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                  댓글
                </span>
                <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                  {comments.length}
                </span>
              </div>

              {/* 댓글 입력 폼 */}
              <CommentForm postId={id} />

              {/* 댓글 리스트 */}
              <div className="space-y-8 mt-8">
                {comments.map((c) => (
                  <div key={c.id.toString()} className="flex gap-4">
                    {/* 댓글 작성자 아바타 */}
                    {c.users?.profile_image_url ? (
                      <img
                        src={c.users.profile_image_url}
                        alt={c.users.nickname ?? ""}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {(c.users?.nickname ?? "?").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      {/* 댓글 작성자 정보 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-bold"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {c.users?.nickname ?? "익명"}
                          </span>
                          {/* 게시글 작성자 표시 */}
                          {c.user_id === post.user_id && (
                            <span
                              className="text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-tighter"
                              style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
                            >
                              작성자
                            </span>
                          )}
                          <span
                            className="text-[11px] ml-2"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {formatRelativeTime(c.created_at)}
                          </span>
                        </div>
                        <button style={{ color: "var(--color-text-muted)" }}>
                          <span className="material-symbols-outlined text-lg">more_horiz</span>
                        </button>
                      </div>

                      {/* 댓글 내용 */}
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {c.content}
                      </p>

                      {/* 댓글 좋아요 + 답글 쓰기 */}
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <span className="material-symbols-outlined text-sm">thumb_up</span>
                          {c.likes_count > 0 ? c.likes_count : ""}
                        </button>
                        <button
                          className="text-xs font-medium"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          답글 쓰기
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 댓글 없음 */}
                {comments.length === 0 && (
                  <p
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* 우측: 사이드바 */}
        <div className="lg:col-span-4">
          <PostDetailSidebar
            authorId={post.user_id}
            authorNickname={post.users?.nickname ?? "익명"}
            authorImage={post.users?.profile_image_url ?? null}
          />
        </div>
      </div>
    </div>
  );
}

