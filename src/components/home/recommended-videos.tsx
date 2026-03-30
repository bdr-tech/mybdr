"use client";

/* ============================================================
 * RecommendedVideos — BDR 추천 영상 섹션 (토스 스타일)
 *
 * 토스 스타일 변경:
 * - TossSectionHeader로 "인기 영상" + "더보기 >" 헤더
 * - TossCard 스타일 카드 (둥근 모서리, 가벼운 그림자)
 * - 가로 스크롤 캐러셀 유지
 *
 * API/데이터 패칭 로직은 기존과 100% 동일.
 * ============================================================ */

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { TossSectionHeader } from "@/components/toss/toss-section-header";

interface VideoItem {
  video_id: string;
  title: string;
  thumbnail: string;
  published_at: string;
  badges: string[];
  is_live: boolean;
}

/* 더미 데이터: API 로딩 실패 시 표시용 */
const DUMMY_VIDEOS = [
  {
    video_id: "dummy1",
    title: "2023 서울 챌린지 베스트 골 TOP 10",
    thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=60",
    duration: "12:45",
    views: "24.5만회",
    date: "2일 전",
  },
  {
    video_id: "dummy2",
    title: "실전에서 바로 써먹는 드리블 기술 가이드",
    thumbnail: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=400&q=60",
    duration: "08:20",
    views: "12.8만회",
    date: "1주일 전",
  },
  {
    video_id: "dummy3",
    title: "Storm FC의 우승 비결 인터뷰",
    thumbnail: "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=400&q=60",
    duration: "15:10",
    views: "5.2만회",
    date: "3일 전",
  },
  {
    video_id: "dummy4",
    title: "매치데이 브이로그: 대회 현장의 열기",
    thumbnail: "https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=400&q=60",
    duration: "05:45",
    views: "1.9만회",
    date: "22시간 전",
  },
];

export function RecommendedVideos() {
  // useSWR로 YouTube 추천 API 호출 (기존과 동일)
  const { data: apiData, isLoading: loading } = useSWR<{ videos: VideoItem[] }>(
    "/api/web/youtube/recommend"
  );
  const videos = apiData?.videos ?? [];

  if (loading) {
    return (
      <section>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-56 rounded-2xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  const hasApiData = videos.length > 0;

  return (
    <section>
      {/* 토스 스타일 섹션 헤더 */}
      <TossSectionHeader
        title="인기 영상"
        actionLabel="더보기"
        actionHref="https://www.youtube.com/@BDRBASKET"
      />

      {/* 가로 스크롤 캐러셀: 토스 카드 스타일 */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
        {hasApiData
          ? /* API 영상 카드 */
            videos.slice(0, 6).map((v) => (
              <a
                key={v.video_id}
                href={`https://www.youtube.com/watch?v=${v.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block shrink-0 w-56"
              >
                <div
                  className="group rounded-2xl overflow-hidden bg-[var(--color-card)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-elevated)]"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  {/* 썸네일 */}
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={v.thumbnail}
                    />
                    {/* 재생 아이콘 호버 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                    </div>
                    {/* LIVE 뱃지 */}
                    {v.is_live && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                        라이브
                      </span>
                    )}
                  </div>
                  {/* 제목 + 날짜 */}
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1 mb-1">
                      {v.title}
                    </h4>
                    <p className="text-xs text-[var(--color-text-muted)]">{formatDate(v.published_at)}</p>
                  </div>
                </div>
              </a>
            ))
          : /* 더미 영상 카드 */
            DUMMY_VIDEOS.map((v) => (
              <div key={v.video_id} className="shrink-0 w-56">
                <div
                  className="group rounded-2xl overflow-hidden bg-[var(--color-card)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-elevated)]"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={v.thumbnail}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-md font-bold">
                      {v.duration}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1 mb-1">
                      {v.title}
                    </h4>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {v.views} · {v.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}

/* 날짜 포맷 헬퍼: ISO 문자열 -> "2일 전" 형태 */
function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}
