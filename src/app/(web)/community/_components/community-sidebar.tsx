"use client";

import Link from "next/link";

// API에서 내려오는 게시글 타입 (community-content.tsx와 동일)
interface PostFromApi {
  id: string;
  public_id: string;
  title: string;
  category: string | null;
  view_count: number;
  comments_count: number;
  created_at: string | null;
  author_nickname: string;
}

// 카테고리 라벨 매핑 (인기글 카테고리 표시용)
const categoryLabelMap: Record<string, string> = {
  general: "자유게시판",
  info: "정보공유",
  review: "대회후기",
  marketplace: "농구장터",
  recruit: "팀원모집",
  qna: "질문답변",
  notice: "공지사항",
};

interface CommunitySidebarProps {
  posts: PostFromApi[];  // 전체 게시글 (인기글 정렬용)
}

/**
 * CommunitySidebar - 커뮤니티 목록 우측 사이드바
 *
 * 시안(bdr_2/bdr_4) 기반:
 * 1. 인기 게시글 TOP 5 (조회수 기준 정렬)
 * 2. 실시간 인기글 (최근 + 조회수 조합)
 * 3. 이벤트/광고 배너 (placeholder)
 * 4. 글쓰기 버튼
 */
export function CommunitySidebar({ posts }: CommunitySidebarProps) {
  // 조회수 기준으로 정렬하여 상위 5개를 인기글로 선정
  const popularPosts = [...posts]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5);

  // 실시간 인기글: 최근 게시글 중 조회수 높은 것 3개 (인기글과 다른 기준)
  const trendingPosts = [...posts]
    .slice(0, 15)  // 최근 15개 중에서
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 3);

  return (
    <aside className="space-y-6">
      {/* 인기 게시글 TOP 5 */}
      <section
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        {/* 헤더 */}
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-elevated)" }}
        >
          <h4 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
            인기 게시글 TOP 5
          </h4>
          <span
            className="material-symbols-outlined text-sm"
            style={{ color: "var(--color-primary)" }}
          >
            trending_up
          </span>
        </div>

        {/* 인기글 리스트 */}
        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {popularPosts.map((post, idx) => (
            <Link
              key={post.id}
              href={`/community/${post.public_id}`}
              className="flex gap-4 p-4 transition-colors group"
              style={{ borderColor: "var(--color-border)" }}
            >
              {/* 순위 숫자: 1등은 primary 색상, 나머지는 muted */}
              <span
                className="font-bold text-lg shrink-0"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: idx === 0 ? "var(--color-primary)" : "var(--color-text-muted)",
                }}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {post.title}
                </p>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  조회수 {post.view_count.toLocaleString()}
                </span>
              </div>
            </Link>
          ))}

          {/* 인기글이 없을 때 */}
          {popularPosts.length === 0 && (
            <div className="p-4 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              아직 게시글이 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* 실시간 인기글 */}
      <section
        className="rounded-lg border p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h4
          className="text-sm font-bold mb-4 uppercase tracking-wider opacity-60"
          style={{ color: "var(--color-text-primary)" }}
        >
          실시간 인기글
        </h4>
        <div className="space-y-4">
          {trendingPosts.map((post) => (
            <Link key={post.id} href={`/community/${post.public_id}`} className="group block">
              <span className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>
                커뮤니티 &gt; {categoryLabelMap[post.category ?? ""] ?? "기타"}
              </span>
              <p
                className="text-sm transition-colors line-clamp-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {post.title}
              </p>
            </Link>
          ))}

          {trendingPosts.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              아직 게시글이 없습니다.
            </p>
          )}
        </div>
      </section>

      {/* 이벤트/광고 배너 (placeholder) */}
      <div
        className="relative rounded-lg aspect-[4/3] overflow-hidden flex items-center justify-center border"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-elevated)" }}
      >
        <div className="relative z-10 text-center p-4">
          <span
            className="text-xs px-2 py-0.5 rounded mb-2 inline-block border"
            style={{
              backgroundColor: "var(--color-elevated)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            ADVERTISEMENT
          </span>
          <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>
            BDR 공식 굿즈
            <br />
            신상 런칭 이벤트
          </p>
        </div>
      </div>

      {/* 글쓰기 버튼 */}
      <Link
        href="/community/new"
        className="block w-full py-3 text-center text-sm font-bold text-white rounded transition-colors active:scale-95"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        커뮤니티 글쓰기
      </Link>
    </aside>
  );
}
