"use client";

/* ============================================================
 * RecommendedVideos — BDR 추천 영상 섹션 (NBA 2K 스타일)
 *
 * 2K 스타일 적용:
 * - 인라인 2K 헤더 "HIGHLIGHTS" (font-black uppercase)
 * - 카드에 hover:shadow-glow-primary + hover:border-primary 효과
 * - LIVE 뱃지에 rounded-sm 적용
 * - 제목 font-extrabold uppercase
 *
 * API/데이터 패칭 로직은 기존과 100% 동일.
 * ============================================================ */

import useSWR from "swr";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

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
            <Skeleton key={i} className="aspect-video w-56 rounded-md shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  const hasApiData = videos.length > 0;

  return (
    <section>
      {/* 2K 스타일 인라인 헤더: font-black uppercase (다른 홈 섹션과 통일) */}
      <div className="flex items-end justify-between mb-4 pb-2 border-b-2 border-[var(--color-border)]">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter drop-shadow-sm">
          HIGHLIGHTS
        </h2>
        <Link
          href="https://www.youtube.com/@BDRBASKET"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors uppercase"
        >
          VIEW ALL &raquo;
        </Link>
      </div>

      {/* 가로 스크롤 캐러셀: 2K 카드 스타일 (네온 호버, uppercase) */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
        {hasApiData
          ? /* API 영상 카드 — 2K 스타일 적용 */
            videos.slice(0, 6).map((v) => (
              <a
                key={v.video_id}
                href={`https://www.youtube.com/watch?v=${v.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block shrink-0 w-56"
              >
                {/* 2K 카드: 각진 모서리, 네온 글로우 호버, 프라이머리 보더 호버 */}
                <div
                  className="group rounded-md overflow-hidden bg-[var(--color-card)] transition-all duration-300 hover:-translate-y-2 hover:shadow-glow-primary border border-transparent hover:border-[var(--color-primary)] h-full flex flex-col relative"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  {/* 워터마크: 호버 시 재생 아이콘 실루엣 */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-5 font-black text-7xl transition-all duration-500 pointer-events-none z-0">
                    <span className="material-symbols-outlined text-8xl">play_arrow</span>
                  </div>

                  {/* 썸네일 영역 */}
                  <div className="aspect-video relative overflow-hidden shrink-0 z-10">
                    <img
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={v.thumbnail}
                    />
                    {/* 그라디언트 오버레이 (하단 → 카드 배경색) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-transparent to-black/20" />
                    {/* 재생 아이콘 호버 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                    </div>
                    {/* LIVE 뱃지 */}
                    {v.is_live && (
                      <span className="absolute top-2 left-2 bg-[var(--color-primary)] text-white text-[10px] px-2.5 py-1 font-black uppercase rounded-sm flex items-center gap-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                        LIVE
                      </span>
                    )}
                  </div>
                  {/* 정보 영역: gradient 배경 + 2K 폰트 스타일 */}
                  <div className="p-3 flex flex-col grow z-10 bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface)]">
                    <h4 className="text-sm font-extrabold text-[var(--color-text-primary)] line-clamp-1 mb-1 tracking-tight uppercase group-hover:text-[var(--color-primary)] transition-colors">
                      {v.title}
                    </h4>
                    <p className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase">
                      {formatDate(v.published_at)}
                    </p>
                  </div>
                </div>
              </a>
            ))
          : /* 더미 영상 카드 — 동일 2K 스타일 적용 */
            DUMMY_VIDEOS.map((v) => (
              <div key={v.video_id} className="shrink-0 w-56">
                <div
                  className="group rounded-md overflow-hidden bg-[var(--color-card)] transition-all duration-300 hover:-translate-y-2 hover:shadow-glow-primary border border-transparent hover:border-[var(--color-primary)] h-full flex flex-col relative"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  {/* 워터마크 */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-5 font-black text-7xl transition-all duration-500 pointer-events-none z-0">
                    <span className="material-symbols-outlined text-8xl">play_arrow</span>
                  </div>

                  <div className="aspect-video relative overflow-hidden shrink-0 z-10">
                    <img
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={v.thumbnail}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-transparent to-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                    </div>
                    {/* 재생시간 뱃지 */}
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 font-black rounded-sm">
                      {v.duration}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col grow z-10 bg-gradient-to-br from-[var(--color-card)] to-[var(--color-surface)]">
                    <h4 className="text-sm font-extrabold text-[var(--color-text-primary)] line-clamp-1 mb-1 tracking-tight uppercase group-hover:text-[var(--color-primary)] transition-colors">
                      {v.title}
                    </h4>
                    <p className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase">
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
