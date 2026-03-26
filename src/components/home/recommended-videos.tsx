"use client";

/* ============================================================
 * RecommendedVideos — BDR 추천 영상 섹션 (리디자인)
 *
 * 왜 리디자인했는가: 기존 가로 스크롤 전용에서
 * 모바일 가로 스크롤 + 데스크탑 4열 그리드로 변경.
 * 빨간 세로 막대 헤더 스타일로 통일.
 *
 * 구조:
 * - 빨간 세로 막대 + "BDR 추천 영상" + "더보기" 링크
 * - 비디오 카드: aspect-video 썸네일 + play_circle 호버 + 재생시간 + 제목 + 조회수
 * ============================================================ */

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoItem {
  video_id: string;
  title: string;
  thumbnail: string;
  published_at: string;
  badges: string[];
  is_live: boolean;
}

/* 더미 데이터: API 로딩 실패 시 또는 개발 중 표시용 */
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
  // useSWR로 YouTube 추천 API 호출 (hero-bento와 같은 URL → SWR이 자동 중복 제거)
  const { data: apiData, isLoading: loading } = useSWR<{ videos: VideoItem[] }>(
    "/api/web/youtube/recommend"
  );
  const videos = apiData?.videos ?? [];

  if (loading) {
    return (
      <section className="mt-16">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  /* API 데이터가 있으면 사용, 없으면 더미 데이터 */
  const hasApiData = videos.length > 0;

  return (
    <section className="mt-16">
      {/* 섹션 헤더: 빨간 세로 막대 + 제목 + 더보기 */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-3">
          <span className="w-1.5 h-6 bg-primary" />
          BDR 추천 영상
        </h3>
        <a
          href="https://www.youtube.com/@BDRBASKET"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-text-muted hover:text-primary transition-colors"
        >
          더보기
        </a>
      </div>

      {/* 반응형 레이아웃: 모바일 가로 스크롤 / 데스크탑 4열 그리드 */}
      <div className="flex flex-row overflow-x-auto gap-6 no-scrollbar -mx-6 px-6 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
        {hasApiData
          ? /* API 데이터 기반 카드 */
            videos.slice(0, 4).map((v) => (
              <a
                key={v.video_id}
                href={`https://www.youtube.com/watch?v=${v.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[260px] md:min-w-0 group cursor-pointer"
              >
                <div className="aspect-video bg-surface rounded-xl overflow-hidden mb-3 relative border border-border">
                  <img
                    alt={v.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    src={v.thumbnail}
                  />
                  {/* play_circle 호버 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <span className="material-symbols-outlined text-white text-5xl">play_circle</span>
                  </div>
                  {/* LIVE 뱃지 */}
                  {v.is_live && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      라이브
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                  {v.title}
                </h4>
                <p className="text-xs text-text-muted">{formatDate(v.published_at)}</p>
              </a>
            ))
          : /* 더미 데이터 기반 카드 */
            DUMMY_VIDEOS.map((v) => (
              <div key={v.video_id} className="min-w-[260px] md:min-w-0 group cursor-pointer">
                <div className="aspect-video bg-surface rounded-xl overflow-hidden mb-3 relative border border-border">
                  <img
                    alt={v.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    src={v.thumbnail}
                  />
                  {/* play_circle 호버 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <span className="material-symbols-outlined text-white text-5xl">play_circle</span>
                  </div>
                  {/* 재생시간 뱃지 */}
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-bold">
                    {v.duration}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                  {v.title}
                </h4>
                <p className="text-xs text-text-muted">
                  조회수 {v.views} &bull; {v.date}
                </p>
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
