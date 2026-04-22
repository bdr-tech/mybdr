"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
import { TossCard } from "@/components/toss/toss-card";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
// [2026-04-22] 카페 원문 HTML entity 디코드 — Stage A 확장 후속
import { decodeHtmlEntities } from "@/lib/utils/decode-html";

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
  author_profile_image: string | null;   // 작성자 프로필 이미지 URL
  content_preview: string;               // 본문 미리보기
}

interface CommunityApiResponse {
  posts: PostFromApi[];
  preferred_categories: string[];
}

// 카테고리 맵: DB 키 -> 한글 라벨 + 뱃지 색상
// 카테고리별 뱃지 색상: CSS 변수 사용 (하드코딩 금지 원칙)
const categoryMap: Record<string, { label: string; bg: string; color: string }> = {
  general:     { label: "자유게시판", bg: "var(--color-primary)",       color: "#fff" },
  recruit:     { label: "팀원모집",   bg: "var(--color-success)",       color: "#fff" },
  review:      { label: "대회후기",   bg: "var(--color-warning)",       color: "#fff" },
  info:        { label: "정보공유",   bg: "var(--color-ai-purple)",     color: "#fff" },
  qna:         { label: "질문답변",   bg: "var(--color-info)",          color: "#fff" },
  notice:      { label: "공지사항",   bg: "var(--color-error)",         color: "#fff" },
  marketplace: { label: "농구장터",   bg: "var(--color-tier-trophy)",   color: "#fff" },
};

// 카테고리 탭 배열 (전체 + 7개 카테고리)
const categoryTabs = [
  { key: null, label: "전체" },
  ...Object.entries(categoryMap).map(([key, { label }]) => ({ key, label })),
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

// -- 스켈레톤 UI (토스 스타일 카드형) --
function CommunityListSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--color-card)] rounded-md p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-14 rounded" />
            <Skeleton className="h-4 w-3/5 rounded" />
          </div>
          <Skeleton className="h-3 w-full rounded mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 서버 프리페치 데이터를 받기 위한 props 타입
interface CommunityContentProps {
  fallbackPosts?: PostFromApi[];
}

/**
 * CommunityContent - 게시판 목록 (토스 스타일)
 *
 * 변경: 2열 레이아웃 -> 1열 세로 스택 (max-w-640px)
 * 카테고리 탭: pill 스타일
 * 게시글: TossCard로 카드 형태
 * 사이드바: 제거 (1열 레이아웃이므로 불필요)
 */
export function CommunityContent({ fallbackPosts }: CommunityContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 게시글 데이터 + 로딩 상태
  const [posts, setPosts] = useState<PostFromApi[]>(fallbackPosts ?? []);
  const [loading, setLoading] = useState(!fallbackPosts);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(!!fallbackPosts);
  const [currentPage, setCurrentPage] = useState(1);

  // 전역 맞춤 필터 Context
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
    const hasFiltersInUrl = searchParams.get("category") || searchParams.get("q") || preferFilter;
    if (initialLoadDone && !hasFiltersInUrl) {
      setInitialLoadDone(false);
      return;
    }
    setInitialLoadDone(false);

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

  // 페이지네이션 계산
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const paginatedPosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const hasFilters = category || appliedQuery || preferFilter;

  return (
    /* 토스 스타일: 1열 세로 스택, 최대 640px */
    <div className="max-w-[640px] mx-auto">
      {/* 페이지 제목 */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          커뮤니티
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          농구인들의 이야기를 나눠보세요
        </p>
      </div>

      {/* 검색바: 토스 스타일 둥근 검색 인풋 */}
      <form onSubmit={handleSearch} className="mb-5">
        <div className="relative">
          <span
            className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="게시글, 사용자 검색"
            className="w-full rounded-md py-3 pl-11 pr-4 text-sm outline-none"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>
      </form>

      {/* 카테고리 탭: 토스 스타일 pill 탭 (가로 스크롤) */}
      {/* 맞춤 필터 ON + preferredCategories가 있으면 해당 카테고리 탭만 표시 */}
      <div
        className="mb-6 overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex gap-2 min-w-max">
          {categoryTabs
            .filter((tab) => {
              // 맞춤 필터가 꺼져있거나 선호 카테고리가 없으면 전체 탭 표시
              if (!preferFilter || preferredCategories.length === 0) return true;
              // "전체" 탭(key=null)은 항상 표시
              if (tab.key === null) return true;
              // 선호 카테고리에 포함된 탭만 표시
              return preferredCategories.includes(tab.key);
            })
            .map((tab) => {
              const isActive = category === tab.key;
              return (
                <button
                  key={tab.key ?? "all"}
                  type="button"
                  onClick={() => handleCategoryChange(tab.key)}
                  className="px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-all"
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--color-primary)",
                          color: "#FFFFFF",
                        }
                      : {
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text-muted)",
                        }
                  }
                >
                  {tab.label}
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

      {/* 로딩 중이면 스켈레톤 */}
      {loading ? (
        <CommunityListSkeleton />
      ) : (
        <>
          {/* 게시글 카드 리스트: TossCard 스타일 */}
          <div className="space-y-6">
            {paginatedPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}

            {/* 빈 상태 + CTA */}
            {posts.length === 0 && (
              <div className="py-16 text-center">
                <span
                  className="material-symbols-outlined text-5xl mb-3 block"
                  style={{ color: "var(--color-text-disabled)" }}
                >
                  forum
                </span>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  {hasFilters
                    ? "조건에 맞는 게시글이 없습니다"
                    : "아직 게시글이 없어요"}
                </p>
                {/* 빈 상태 액션 버튼: 글쓰기 */}
                <Link
                  href="/community/new"
                  className="inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.97]"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  글쓰기
                </Link>
              </div>
            )}
          </div>

          {/* 글쓰기 CTA: 토스 스타일 풀와이드 버튼 */}
          <Link
            href="/community/new"
            className="block mt-6 w-full py-4 text-center text-sm font-bold text-white rounded-md transition-all active:scale-[0.98]"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            글쓰기
          </Link>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-md transition-colors disabled:opacity-30"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-muted)",
                }}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className="w-10 h-10 flex items-center justify-center rounded-md font-bold text-sm transition-colors"
                  style={
                    page === currentPage
                      ? { backgroundColor: "var(--color-primary)", color: "#FFFFFF" }
                      : {
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text-secondary)",
                        }
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-md transition-colors disabled:opacity-30"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-muted)",
                }}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// -- 게시글 카드 컴포넌트 (토스 스타일 TossCard) --
// 둥근 카드 안에 카테고리 배지 + 제목 + 미리보기 + 작성자 + 통계
function PostCard({ post }: { post: PostFromApi }) {
  const cat = categoryMap[post.category ?? ""];
  const categoryLabel = cat?.label ?? post.category ?? "기타";
  const badgeBg = cat?.bg ?? "#6b7280";
  const badgeColor = cat?.color ?? "#fff";

  return (
    <Link href={`/community/${post.public_id}`}>
      <div
        className="bg-[var(--color-card)] rounded-md p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-[var(--shadow-elevated)] cursor-pointer"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* 1행: 카테고리 배지 + 시간 */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: badgeBg, color: badgeColor }}
          >
            {categoryLabel}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {/* 2행: 제목 */}
        <h3
          className="text-sm font-bold leading-snug line-clamp-2 mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          {decodeHtmlEntities(post.title)}
        </h3>

        {/* 3행: 본문 미리보기 (있으면 표시) */}
        {post.content_preview && (
          <p
            className="text-xs line-clamp-2 mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            {decodeHtmlEntities(post.content_preview)}
          </p>
        )}

        {/* 4행: 작성자 + 통계 */}
        <div className="flex items-center justify-between">
          {/* 좌: 아바타 + 닉네임 */}
          <div className="flex items-center gap-2">
            {post.author_profile_image ? (
              <img
                src={post.author_profile_image}
                alt={post.author_nickname}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {post.author_nickname.charAt(0)}
              </div>
            )}
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {decodeHtmlEntities(post.author_nickname)}
            </span>
          </div>

          {/* 우: 통계 아이콘들 */}
          <div
            className="flex items-center gap-3 text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>visibility</span>
              {post.view_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>thumb_up</span>
              {post.likes_count}
            </span>
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chat_bubble</span>
              {post.comments_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
