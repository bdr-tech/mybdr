"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
import { CommunitySidebar } from "./community-sidebar";

// API에서 내려오는 게시글 데이터 타입 (apiSuccess가 snake_case로 자동 변환)
interface PostFromApi {
  id: string;
  public_id: string;
  title: string;
  category: string | null;
  view_count: number;
  comments_count: number;
  likes_count: number;
  created_at: string | null;
  author_nickname: string;
  author_profile_image: string | null;   // 작성자 프로필 이미지 URL (신규)
  content_preview: string;               // 본문 미리보기 (신규)
}

interface CommunityApiResponse {
  posts: PostFromApi[];
  preferred_categories: string[];
}

// 카테고리 맵: DB 키 -> 한글 라벨 (시안 기준 7개 카테고리)
const categoryMap: Record<string, string> = {
  general: "자유게시판",
  recruit: "팀원모집",
  review: "대회후기",
  info: "정보공유",
  qna: "질문답변",
  notice: "공지사항",
  marketplace: "농구장터",
};

// 카테고리 탭 배열 (전체 + 7개 카테고리)
const categoryTabs = [
  { key: null, label: "전체" },
  ...Object.entries(categoryMap).map(([key, label]) => ({ key, label })),
];

// 페이지당 게시글 수 (클라이언트 사이드 페이지네이션)
const POSTS_PER_PAGE = 10;

// -- 상대 시간 포맷 (예: "2시간 전", "어제") --
function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
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
  } catch {
    return "";
  }
}

// -- 스켈레톤 UI (2열 레이아웃) --
function CommunityGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 좌측: 게시글 리스트 스켈레톤 */}
      <div className="lg:col-span-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border p-5"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded mb-2" />
            <Skeleton className="h-4 w-full rounded mb-1" />
            <Skeleton className="h-4 w-2/3 rounded mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* 우측: 사이드바 스켈레톤 */}
      <div className="lg:col-span-4 space-y-6">
        <div
          className="rounded-lg border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <Skeleton className="h-5 w-32 mb-4 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 mb-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * CommunityContent - 게시판 목록 클라이언트 컴포넌트
 *
 * 2열 레이아웃 (좌: 카테고리탭 + 게시글카드 + 페이지네이션 / 우: 사이드바)
 * 시안(bdr_2/bdr_4) 기반 리디자인
 */
export function CommunityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 게시글 데이터 + 로딩 상태 + 선호 카테고리 목록
  const [posts, setPosts] = useState<PostFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  // 클라이언트 사이드 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);

  // 전역 선호 필터 Context
  const { preferFilter } = usePreferFilter();

  // URL에서 필터 상태 읽기
  const category = searchParams.get("category") || null;
  const appliedQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(appliedQuery);

  // 카테고리 변경 시 페이지를 1로 리셋
  const handleCategoryChange = useCallback((cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set("category", cat);
    } else {
      params.delete("category");
    }
    router.push(`${pathname}?${params.toString()}`);
    setCurrentPage(1);
  }, [searchParams, router, pathname]);

  // API 호출: searchParams 또는 preferFilter 변경 시
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams(searchParams.toString());
    if (preferFilter) {
      params.set("prefer", "true");
    } else {
      params.delete("prefer");
    }
    const url = `/api/web/community?${params.toString()}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<CommunityApiResponse>;
      })
      .then((data) => {
        if (data) {
          setPosts(data.posts ?? []);
          setPreferredCategories(data.preferred_categories ?? []);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setPosts([]);
      })
      .finally(() => {
        setLoading(false);
        setCurrentPage(1);
      });

    return () => controller.abort();
  }, [searchParams, preferFilter]);

  // 검색 폼 제출
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const paginatedPosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const hasFilters = category || appliedQuery || preferFilter;

  return (
    <div>
      {/* 페이지 제목 */}
      <h2
        className="text-3xl font-bold mb-6 tracking-tight"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
      >
        커뮤니티
      </h2>

      {/* 검색바 + 글쓰기 버튼 */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="게시글, 사용자 검색"
              className="w-full border rounded py-2 pl-10 pr-4 text-sm outline-none"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
          <button
            type="submit"
            className="rounded px-4 py-2 text-sm font-semibold text-white shrink-0"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            검색
          </button>
        </div>
      </form>

      {/* 카테고리 인라인 탭 (가로 스크롤, 밑줄 스타일) */}
      <div
        className="mb-6 overflow-x-auto"
        style={{
          /* 스크롤바 숨김 */
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div
          className="flex gap-1 border-b min-w-max"
          style={{ borderColor: "var(--color-border)" }}
        >
          {categoryTabs.map((tab) => {
            // 현재 선택된 탭인지 확인
            const isActive = category === tab.key;
            return (
              <button
                key={tab.key ?? "all"}
                type="button"
                onClick={() => handleCategoryChange(tab.key)}
                className="px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors relative"
                style={{
                  color: isActive
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {tab.label}
                {/* 선택된 탭 하단 밑줄 (빨간색 2px) */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 검색 결과 안내 */}
      {hasFilters && !loading && (
        <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {appliedQuery && (
            <>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                &ldquo;{appliedQuery}&rdquo;
              </span>{" "}
              검색 결과{" "}
            </>
          )}
          <span className="font-medium" style={{ color: "var(--color-primary)" }}>
            {posts.length}건
          </span>
        </p>
      )}

      {/* 로딩 중이면 스켈레톤, 아니면 2열 레이아웃 */}
      {loading ? (
        <CommunityGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 좌측: 게시글 리스트 */}
          <div className="lg:col-span-8">
            <div className="space-y-4">
              {paginatedPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}

              {/* 빈 상태 */}
              {posts.length === 0 && (
                <div
                  className="text-center py-12 rounded-lg border"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-card)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {hasFilters
                    ? "조건에 맞는 게시글이 없습니다."
                    : "게시글이 없습니다."}
                </div>
              )}
            </div>

            {/* 페이지네이션: 시안 기준 숫자형 */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                {/* 이전 페이지 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded border transition-colors disabled:opacity-30"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-card)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {/* 페이지 번호 */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10 flex items-center justify-center rounded font-bold text-sm transition-colors"
                    style={
                      page === currentPage
                        ? { backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }
                        : {
                            border: "1px solid var(--color-border)",
                            backgroundColor: "var(--color-card)",
                            color: "var(--color-text-secondary)",
                          }
                    }
                  >
                    {page}
                  </button>
                ))}

                {/* 다음 페이지 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded border transition-colors disabled:opacity-30"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-card)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>

          {/* 우측: 사이드바 */}
          <div className="lg:col-span-4">
            <CommunitySidebar posts={posts} />
          </div>
        </div>
      )}
    </div>
  );
}

// -- 게시글 카드 컴포넌트 (시안 bdr_2 기반) --
function PostCard({ post }: { post: PostFromApi }) {
  const categoryLabel = categoryMap[post.category ?? ""] ?? post.category ?? "기타";

  return (
    <Link href={`/community/${post.public_id}`}>
      <article
        className="border p-5 rounded-lg transition-all group cursor-pointer"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        {/* 작성자 정보: 아바타 + 닉네임 + 시간 */}
        <div className="flex items-center gap-2 mb-3">
          {/* 작성자 아바타: 이미지 있으면 img, 없으면 닉네임 첫 글자 */}
          {post.author_profile_image ? (
            <img
              src={post.author_profile_image}
              alt={post.author_nickname}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {post.author_nickname.charAt(0)}
            </div>
          )}
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {post.author_nickname}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {/* 제목 */}
        <h3
          className="text-lg font-bold mb-2 leading-snug transition-colors"
          style={{ color: "var(--color-text-primary)" }}
        >
          {post.title}
        </h3>

        {/* 본문 미리보기 */}
        {post.content_preview && (
          <p
            className="text-sm line-clamp-2 leading-relaxed mb-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {post.content_preview}
          </p>
        )}

        {/* 메타 정보: 카테고리 + 조회수/좋아요/댓글수 */}
        <div className="flex items-center justify-between">
          {/* 카테고리 배지 */}
          <span
            className="text-xs px-2 py-0.5 rounded font-bold uppercase"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-on-primary)",
              opacity: 0.9,
            }}
          >
            {categoryLabel}
          </span>

          {/* 메타 수치: 조회수 + 좋아요 + 댓글 */}
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">visibility</span>
              {post.view_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">thumb_up</span>
              {post.likes_count}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">chat_bubble</span>
              {post.comments_count}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
