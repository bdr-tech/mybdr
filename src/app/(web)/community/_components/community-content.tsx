"use client";

/**
 * CommunityContent — BDR v2 BoardList 시안 기반 (Phase 4)
 *
 * 이유: BDR v2 시안 `screens/BoardList.jsx`를 그대로 따르면서
 *       기존 API 호출/SSR fallback/preferFilter Context/searchParams 동기화 100% 보존.
 *       UI만 v2로 교체 (with-aside 2열 레이아웃 + 좌측 CommunityAside + board 테이블).
 *
 * 보존 사항:
 *   - `/api/web/community?...` API 호출 그대로 (apiSuccess snake_case)
 *   - SSR 프리페치 fallbackPosts 즉시 렌더 패턴 그대로
 *   - usePreferFilter Context (전역 맞춤 필터) 그대로
 *   - searchParams 동기화 (?category= / ?q=) 그대로
 *   - decodeHtmlEntities 카페 원문 디코드 그대로
 *
 * 변경 사항:
 *   - 토스 스타일 1열 카드 → 시안 .with-aside 2열 (좌 사이드바 + 우 board 테이블)
 *   - 페이지당 10개 → 20개 (PM 결정, 시안 충실)
 *   - 정렬 4종 추가 (최신순/인기순/댓글많은순/조회순) — 클라 사이드 정렬
 *   - 새글 24h 뱃지 (badge--new "N")
 *   - 공지(category=notice)는 시안의 pinned 패턴처럼 항상 상단에 고정 표시
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
import { decodeHtmlEntities } from "@/lib/utils/decode-html";
import { CommunityAside } from "./community-aside";
import { V2Pager } from "@/components/bdr-v2/v2-pager";

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
  author_profile_image: string | null;   // 작성자 프로필 이미지 URL (현재 v2 board 테이블에서는 미사용)
  content_preview: string;               // 본문 미리보기 (현재 v2 board 테이블에서는 미사용)
}

interface CommunityApiResponse {
  posts: PostFromApi[];
  preferred_categories: string[];
}

// 페이지당 게시글 수 — PM 결정: 시안 충실 (한 페이지 20개)
const POSTS_PER_PAGE = 20;

// 새글 판정 임계: 24시간 (시안의 isNew 패턴)
const NEW_BADGE_MS = 24 * 60 * 60 * 1000;

// 정렬 옵션 4종 — 시안 그대로
type SortKey = "latest" | "likes" | "comments" | "views";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "latest",   label: "최신순" },
  { key: "likes",    label: "인기순" },
  { key: "comments", label: "댓글많은순" },
  { key: "views",    label: "조회순" },
];

// 카테고리 라벨 매핑 (board 행 + 헤더 eyebrow에 사용)
const CATEGORY_LABEL: Record<string, string> = {
  general:     "자유게시판",
  recruit:     "팀원모집",
  review:      "대회후기",
  info:        "정보공유",
  qna:         "질문답변",
  notice:      "공지사항",
  marketplace: "농구장터",
};

// 카테고리 → 그룹 (헤더 eyebrow 표시용)
const CATEGORY_TO_GROUP: Record<string, "메인" | "플레이" | "이야기"> = {
  notice:      "메인",
  general:     "메인",
  recruit:     "플레이",
  review:      "플레이",
  marketplace: "플레이",
  qna:         "이야기",
  info:        "이야기",
};

// -- 날짜 포맷 (MM-DD) — 시안의 p.date.slice(5) 패턴 --
function formatBoardDate(isoString: string | null): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    // YYYY-MM-DD에서 MM-DD만 추출
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${m}-${d}`;
  } catch {
    return "";
  }
}

// -- 새글 판정 (created_at이 24시간 이내) --
function isNewPost(isoString: string | null): boolean {
  if (!isoString) return false;
  try {
    const created = new Date(isoString).getTime();
    return Date.now() - created < NEW_BADGE_MS;
  } catch {
    return false;
  }
}

// -- 스켈레톤 (시안 board 테이블 형태) --
function BoardSkeleton() {
  return (
    <div className="board" aria-busy="true">
      <div className="board__head">
        <div>번호</div><div>제목</div><div>작성자</div><div>날짜</div><div>조회</div><div>추천</div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="board__row" style={{ opacity: 0.5 }}>
          <div className="num">…</div>
          <div className="title">로딩 중…</div>
          <div style={{ fontSize: 12 }}>—</div>
          <div style={{ fontSize: 12 }}>—</div>
          <div style={{ fontSize: 12 }}>—</div>
          <div style={{ fontSize: 12 }}>—</div>
        </div>
      ))}
    </div>
  );
}

// 서버 프리페치 데이터를 받기 위한 props 타입
interface CommunityContentProps {
  fallbackPosts?: PostFromApi[];
}

export function CommunityContent({ fallbackPosts }: CommunityContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 게시글 데이터 + 로딩 상태 (기존 패턴 그대로)
  const [posts, setPosts] = useState<PostFromApi[]>(fallbackPosts ?? []);
  const [loading, setLoading] = useState(!fallbackPosts);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(!!fallbackPosts);
  const [currentPage, setCurrentPage] = useState(1);

  // 정렬 상태 — 클라이언트 사이드 (시안 4종)
  const [sortKey, setSortKey] = useState<SortKey>("latest");

  // 전역 맞춤 필터 Context
  const { preferFilter } = usePreferFilter();

  // URL에서 필터 상태 읽기
  const category = searchParams.get("category") || null;
  const appliedQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(appliedQuery);

  // 카테고리 변경 — CommunityAside 클릭 시 호출됨
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

  // API 호출: searchParams 또는 preferFilter 변경 시 (기존 로직 그대로)
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

  // -- 공지/일반 분리 + 정렬 + 페이지네이션 --
  // 이유: 시안에서 pinned는 항상 상단 고정. DB에 is_pinned 컬럼이 없으므로
  //       category=notice를 사실상 공지로 간주해 항상 상단 노출.
  //       단, 사용자가 notice 카테고리를 선택한 경우엔 분리하지 않음(자체 목록).
  const { pinnedPosts, regularPosts, totalPages, paginatedRegular } = useMemo(() => {
    const isNoticeBoard = category === "notice";
    const pinned = isNoticeBoard ? [] : posts.filter((p) => p.category === "notice");
    const rest = isNoticeBoard ? posts : posts.filter((p) => p.category !== "notice");

    // 정렬 (클라이언트 사이드)
    const sorted = [...rest].sort((a, b) => {
      switch (sortKey) {
        case "likes":    return (b.likes_count ?? 0) - (a.likes_count ?? 0);
        case "comments": return (b.comments_count ?? 0) - (a.comments_count ?? 0);
        case "views":    return (b.view_count ?? 0) - (a.view_count ?? 0);
        case "latest":
        default: {
          // created_at 내림차순 (null은 뒤로)
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        }
      }
    });

    const total = Math.ceil(sorted.length / POSTS_PER_PAGE);
    const slice = sorted.slice(
      (currentPage - 1) * POSTS_PER_PAGE,
      currentPage * POSTS_PER_PAGE,
    );
    return {
      pinnedPosts: pinned,
      regularPosts: sorted,
      totalPages: total,
      paginatedRegular: slice,
    };
  }, [posts, sortKey, currentPage, category]);

  const hasFilters = !!(category || appliedQuery || preferFilter);

  // 페이지 헤더 — 카테고리/검색에 따라 동적
  const headerInfo = (() => {
    if (category && CATEGORY_LABEL[category]) {
      return {
        eyebrow: CATEGORY_TO_GROUP[category] ?? "커뮤니티",
        title: CATEGORY_LABEL[category],
      };
    }
    if (appliedQuery) {
      return { eyebrow: "검색 결과", title: `"${appliedQuery}"` };
    }
    return { eyebrow: "커뮤니티", title: "전체글" };
  })();

  // 카테고리 변경 시 검색어 입력값도 URL 동기화 (기존 동작)
  useEffect(() => {
    setSearchQuery(appliedQuery);
  }, [appliedQuery]);

  // 맞춤 필터가 활성화되어 있고 선호 카테고리가 비어있을 때 사용자가 알 수 있도록
  // (현재 설계는 선호 카테고리 토글 UI는 헤더 영역에 두지 않음 — 전역 컨텍스트가 담당)
  void preferredCategories;

  return (
    <div className="page">
      <div className="with-aside">
        {/* 좌측 사이드바: 게시판 그룹 트리 */}
        <CommunityAside
          activeCategory={category}
          onSelect={handleCategoryChange}
        />

        {/* 우측 메인: 헤더 + 정렬 바 + 게시글 테이블 + 페이저 */}
        <main>
          {/* 1. 헤더 — eyebrow + 제목 + 글 수 + 검색 + 글쓰기 */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 16,
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div className="eyebrow">{headerInfo.eyebrow}</div>
              {/* 시안 충실: h1/글수에 whiteSpace:nowrap 박제 */}
              <h1
                style={{
                  margin: "6px 0 4px",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {headerInfo.title}
              </h1>
              <div style={{ fontSize: 13, color: "var(--ink-mute)", whiteSpace: "nowrap" }}>
                {/* 공지(pinned)도 합산 */}
                전체 {(pinnedPosts.length + regularPosts.length).toLocaleString()}개의 글
              </div>
            </div>

            {/* 검색 + 글쓰기 — 시안과 동일하게 우측 상단 */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <form
                onSubmit={handleSearch}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 10px",
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-chip)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: "var(--ink-dim)" }}
                >
                  search
                </span>
                <input
                  className="input"
                  style={{
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    width: 180,
                    fontSize: 13,
                  }}
                  placeholder="게시판 내 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <Link href="/community/new" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                글쓰기
              </Link>
            </div>
          </div>

          {/* 2. 정렬 바 — 4종 토글 + 우측 "한 페이지 20개" 캡션 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
              padding: "10px 12px",
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-chip)",
              fontSize: 13,
              whiteSpace: "nowrap",
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "var(--ink-dim)", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              정렬
            </span>
            {SORT_OPTIONS.map((opt) => {
              const active = sortKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setSortKey(opt.key);
                    setCurrentPage(1); // 정렬 변경 시 1페이지로
                  }}
                  style={{
                    padding: "4px 8px",
                    border: 0,
                    background: active ? "var(--cafe-blue-soft)" : "transparent",
                    color: active ? "var(--cafe-blue-deep)" : "var(--ink-mute)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
            <span style={{ flex: 1 }} />
            <span style={{ color: "var(--ink-dim)", fontSize: 12, whiteSpace: "nowrap" }}>
              한 페이지 {POSTS_PER_PAGE}개
            </span>
          </div>

          {/* 3. 게시글 테이블 — 로딩/빈상태/정상 분기 */}
          {loading ? (
            <BoardSkeleton />
          ) : posts.length === 0 ? (
            // 빈 상태
            <div
              className="board"
              style={{ padding: "60px 20px", textAlign: "center" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}
              >
                forum
              </span>
              <p style={{ fontSize: 14, color: "var(--ink-mute)", marginBottom: 16 }}>
                {hasFilters ? "조건에 맞는 게시글이 없습니다" : "아직 게시글이 없어요"}
              </p>
              <Link href="/community/new" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                첫 글쓰기
              </Link>
            </div>
          ) : (
            <div className="board">
              {/* 헤더 행 */}
              <div className="board__head">
                <div>번호</div>
                <div>제목</div>
                <div>작성자</div>
                <div>날짜</div>
                <div>조회</div>
                <div>추천</div>
              </div>

              {/* 공지 핀 — 항상 상단 (단, 카테고리=notice 선택 시에는 분리 안 함) */}
              {pinnedPosts.map((p) => (
                <PostRow key={`pin-${p.id}`} post={p} pinned />
              ))}

              {/* 일반 글 — 정렬 + 페이지네이션 적용된 슬라이스 */}
              {paginatedRegular.map((p, idx) => {
                // 시안의 번호 채번: 단순 인덱스(역순). 페이지마다 1부터 다시 시작
                // 정확히 시안과 똑같이 하려면 전체 글 수 - (현재 인덱스) 계산
                const globalIndex = (currentPage - 1) * POSTS_PER_PAGE + idx;
                const displayNum = regularPosts.length - globalIndex;
                return <PostRow key={p.id} post={p} num={displayNum} />;
              })}
            </div>
          )}

          {/* 4. 페이지네이션 — 일반 글이 1페이지 초과일 때만 */}
          {!loading && totalPages > 1 && (
            <V2Pager
              current={currentPage}
              total={totalPages}
              onGo={(p) => setCurrentPage(p)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * PostRow — 게시판 행 1줄 (시안 .board__row)
 *
 * pinned=true면 .notice 클래스 + "공지" 배지. false면 일반 글 + 새글 N 뱃지.
 * has_image는 DB 미지원이라 false 고정.
 */
function PostRow({ post, pinned, num }: { post: PostFromApi; pinned?: boolean; num?: number }) {
  // 공지는 글 내용에 카테고리 표시 안 함 (시안 그대로 "공지" 단일 배지)
  const isNew = !pinned && isNewPost(post.created_at);
  // 추천(좋아요) 칸 — likes_count 직접 표시 (시안의 views/30 폴백 사용 안 함)
  const recommendCount = post.likes_count ?? 0;

  return (
    <Link
      href={`/community/${post.public_id}`}
      className={`board__row${pinned ? " notice" : ""}`}
      style={{ display: "grid", textDecoration: "none" }}
    >
      {/* 번호 칸 — 공지면 "공지" 라벨, 아니면 숫자 */}
      <div className="num" data-label="번호">
        {pinned ? "공지" : (num ?? post.id)}
      </div>

      {/* 제목 칸 — 배지/이미지/제목/댓글수/N뱃지 */}
      <div className="title" data-label="제목">
        {pinned && <span className="badge badge--blue">공지</span>}
        {/* has_image: DB 미지원 → 항상 false (TODO: thumbnail_url 컬럼 추가 시 활성) */}
        <span>{decodeHtmlEntities(post.title)}</span>
        {post.comments_count > 0 && (
          <span className="comment-count">[{post.comments_count}]</span>
        )}
        {isNew && (
          <span className="badge badge--new" style={{ marginLeft: 4 }}>
            N
          </span>
        )}
      </div>

      {/* 작성자 */}
      <div data-label="작성자" style={{ fontSize: 12 }}>
        {decodeHtmlEntities(post.author_nickname)}
      </div>

      {/* 날짜 (MM-DD) */}
      <div data-label="날짜" style={{ fontSize: 12, color: "var(--ink-dim)" }}>
        {formatBoardDate(post.created_at)}
      </div>

      {/* 조회수 */}
      <div data-label="조회" style={{ fontSize: 12, color: "var(--ink-dim)" }}>
        {post.view_count.toLocaleString()}
      </div>

      {/* 추천(좋아요) 수 — 공지는 "-" 표시 (시안 그대로) */}
      <div data-label="추천" style={{ fontSize: 12, color: "var(--ink-dim)" }}>
        {pinned ? "-" : recommendCount.toLocaleString()}
      </div>
    </Link>
  );
}
