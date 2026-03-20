"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// API에서 내려오는 게시글 데이터 타입 (apiSuccess가 snake_case로 자동 변환)
interface PostFromApi {
  id: string;                        // BigInt -> string으로 변환됨
  public_id: string;
  title: string;
  category: string | null;
  view_count: number;
  comments_count: number;
  created_at: string | null;          // Date -> ISO string으로 변환됨
  author_nickname: string;            // 작성자 닉네임
}

interface CommunityApiResponse {
  posts: PostFromApi[];
  preferred_categories: string[];  // 유저의 선호 게시판 카테고리 (하이라이트 표시용)
}

// 카테고리 맵 (기존 page.tsx에서 이동)
const categoryMap: Record<string, { label: string; variant: "default" | "success" | "info" | "warning" }> = {
  general: { label: "자유", variant: "default" },
  info: { label: "정보", variant: "info" },
  review: { label: "후기", variant: "success" },
  marketplace: { label: "장터", variant: "warning" },
};

// -- 스켈레톤 UI (로딩 중 표시) --
function CommunityGridSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-[16px] border border-[#E8ECF0] bg-white p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-3/4 rounded" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// -- 날짜 포맷 (ISO string -> 한국어 날짜) --
function formatDate(isoString: string | null): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
  } catch {
    return "";
  }
}

/**
 * CommunityContent - 게시판 목록 클라이언트 컴포넌트
 *
 * 기존 서버 컴포넌트의 form method="GET" 패턴을
 * 클라이언트 state 기반으로 전환하여,
 * 카테고리/검색어 변경 시 API를 재호출한다.
 */
export function CommunityContent() {
  // URL searchParams를 사용하여 필터 상태를 관리 (games-content.tsx 패턴과 동일)
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 게시글 데이터 + 로딩 상태 + 선호 카테고리 목록
  const [posts, setPosts] = useState<PostFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  // URL에서 필터 상태 읽기
  const category = searchParams.get("category") || null;
  const appliedQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(appliedQuery);

  // "내 관심 게시판만 보기" 토글 상태 -- URL의 prefer 파라미터와 동기화
  const preferOn = searchParams.get("prefer") === "true";

  // 토글 클릭 시 URL에 prefer 파라미터를 추가/제거
  const handlePreferToggle = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (preferOn) {
      params.delete("prefer");  // OFF로 전환 -- prefer 파라미터 제거
    } else {
      params.set("prefer", "true"); // ON으로 전환
      params.delete("category");    // 선호 필터 ON 시 개별 카테고리 선택 해제
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [preferOn, searchParams, router, pathname]);

  // 카테고리 선택 핸들러 (URL searchParams 업데이트)
  const handleCategoryChange = useCallback((cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set("category", cat);
      params.delete("prefer"); // 카테고리 직접 선택 시 선호 필터 OFF
    } else {
      params.delete("category");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  // searchParams가 바뀔 때마다 API 호출
  useEffect(() => {
    setLoading(true);

    // 현재 URL의 쿼리 파라미터를 그대로 API에 전달
    const params = new URLSearchParams(searchParams.toString());
    const url = `/api/web/community?${params.toString()}`;

    fetch(url)
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
      .catch(() => {
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  // 검색 폼 제출 핸들러 (URL에 q 파라미터 추가)
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

  // 검색 초기화 핸들러
  const handleClearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  };

  // 필터 활성 여부 (결과 카운트 표시용)
  const hasFilters = category || appliedQuery || preferOn;

  return (
    <div>
      {/* 헤더 영역 */}
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          COMMUNITY
        </h1>
        <div className="flex items-center gap-2">
          {/* 내 관심 게시판만 보기 토글 버튼 (games-content.tsx와 동일 패턴) */}
          <button
            onClick={handlePreferToggle}
            className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
              preferOn
                ? "bg-[#1B3C87] text-white"           // ON: 강조 색상
                : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]" // OFF: 회색
            }`}
            title="내 관심 게시판만 보기"
          >
            {/* 별 아이콘 (게시판 선호는 지역이 아닌 관심 카테고리이므로 별 아이콘 사용) */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill={preferOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="shrink-0">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {preferOn ? "관심 ON" : "관심"}
          </button>
          <Link
            href="/community/new"
            className="rounded-[10px] bg-[#111827] px-5 py-2 text-sm font-bold text-white hover:bg-[#1F2937] transition-colors"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            글쓰기
          </Link>
        </div>
      </div>

      {/* 검색 폼 (기존 form method="GET" -> 클라이언트 state 기반으로 전환) */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목 또는 내용 검색"
            className="flex-1 rounded-full border border-[#E8ECF0] bg-[#FFFFFF] px-4 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#1B3C87]"
          />
          <button
            type="submit"
            className="rounded-full bg-[#1B3C87] px-4 py-2 text-sm font-semibold text-white"
          >
            검색
          </button>
          {appliedQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="rounded-full border border-[#E8ECF0] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#EEF2FF]"
            >
              초기화
            </button>
          )}
        </div>
      </form>

      {/* 카테고리 필터 (클릭 시 URL searchParams 변경 -> API 재호출) */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => handleCategoryChange(null)}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
            !category
              ? "bg-[rgba(27,60,135,0.12)] text-[#1B3C87]"
              : "border border-[#E8ECF0] text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          전체
        </button>
        {Object.entries(categoryMap).map(([key, val]) => {
          // 선호 카테고리인지 확인 (하이라이트 표시용)
          const isPreferred = preferredCategories.includes(key);
          return (
            <button
              type="button"
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                category === key
                  ? "bg-[rgba(27,60,135,0.12)] font-medium text-[#1B3C87]"
                  : isPreferred
                    ? "border-2 border-[#1B3C87]/30 font-medium text-[#1B3C87] hover:bg-[#EEF2FF]"  // 선호 카테고리: 파란 테두리로 하이라이트
                    : "border border-[#E8ECF0] text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {val.label}
              {/* 선호 카테고리에 작은 별 표시 */}
              {isPreferred && (
                <span className="ml-1 text-[10px] text-[#1B3C87]" title="관심 카테고리">*</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 검색 결과 / 필터 결과 안내 */}
      {hasFilters && !loading && (
        <p className="mb-3 text-sm text-[#6B7280]">
          {appliedQuery && (
            <><span className="font-medium text-[#111827]">&ldquo;{appliedQuery}&rdquo;</span> 검색 결과 </>
          )}
          <span className="font-medium text-[#1B3C87]">{posts.length}건</span>
        </p>
      )}

      {/* 로딩 중이면 스켈레톤, 아니면 게시글 목록 */}
      {loading ? (
        <CommunityGridSkeleton />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const cat = categoryMap[p.category ?? ""] ?? {
              label: p.category ?? "기타",
              variant: "default" as const,
            };
            return (
              <Link key={p.id} href={`/community/${p.public_id}`}>
                <Card className="group hover:border-[#1B3C87]/30 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Badge variant={cat.variant}>{cat.label}</Badge>
                    <h3 className="font-bold text-[#111827] group-hover:text-[#1B3C87] transition-colors">
                      {p.title}
                    </h3>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-[#9CA3AF]">
                    <span className="font-medium text-[#6B7280]">{p.author_nickname}</span>
                    <span>{formatDate(p.created_at)}</span>
                    <span className="flex items-center gap-0.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {p.view_count}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      {p.comments_count}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}

          {/* 빈 상태 */}
          {posts.length === 0 && (
            <Card className="text-center text-[#6B7280] py-12">
              {hasFilters ? "조건에 맞는 게시글이 없습니다." : "게시글이 없습니다."}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
