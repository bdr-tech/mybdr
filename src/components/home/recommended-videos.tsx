"use client";

import { useState, useEffect, useRef } from "react";
import { Play, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// API 응답에 맞춘 인터페이스
interface VideoItem {
  video_id: string;
  title: string;
  thumbnail: string;
  published_at: string;
  badges: string[];   // ["LIVE", "스타터스", "HOT", "맞춤"] 등
  is_live: boolean;
}

// 뱃지별 스타일 정의
function getBadgeStyle(badge: string): { bg: string; text: string; icon?: "flame" | "pulse" } {
  switch (badge) {
    case "LIVE":
      // 빨간 배경 + 흰 텍스트 + 깜빡이는 점 애니메이션
      return { bg: "bg-red-600", text: "text-white", icon: "pulse" };
    case "HOT":
      // 빨간/주황 그라데이션
      return { bg: "bg-gradient-to-r from-red-500 to-orange-400", text: "text-white", icon: "flame" };
    case "맞춤":
      // 파란/보라 계열
      return { bg: "bg-indigo-500/15", text: "text-indigo-600" };
    default:
      // 디비전명 (스타터스, 챌린저 등) → 오렌지 계열
      return { bg: "bg-[#F4A261]/15", text: "text-[#E76F00]" };
  }
}

export function RecommendedVideos() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/web/youtube/recommend", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => setVideos(data?.videos ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.7;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] w-[280px] flex-shrink-0 rounded-[16px]" />
          ))}
        </div>
      </section>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section>
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF0000]">
            <Play size={14} className="text-white" fill="white" />
          </div>
          <h2
            className="text-xl font-bold uppercase tracking-wide"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            BDR 추천 영상
          </h2>
        </div>
        <a
          href="https://www.youtube.com/@BDRBASKET"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#FF0000] hover:underline"
        >
          채널 보기 →
        </a>
      </div>

      {/* 영상 카드 가로 스크롤 */}
      <div className="group relative">
        {/* 스크롤 버튼 (데스크탑) */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100 md:block md:opacity-0"
        >
          <ChevronLeft size={18} className="text-[#111827]" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100 md:block md:opacity-0"
        >
          <ChevronRight size={18} className="text-[#111827]" />
        </button>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pb-2"
        >
          {videos.map((v) => (
            <div
              key={v.video_id}
              className="w-[260px] flex-shrink-0 sm:w-[300px]"
            >
              {/* 썸네일 / 플레이어 */}
              <div className="relative aspect-video overflow-hidden rounded-[12px] bg-[#111827]">
                {playingId === v.video_id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${v.video_id}?autoplay=1&rel=0`}
                    title={v.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button
                    onClick={() => setPlayingId(v.video_id)}
                    className="group/thumb relative block h-full w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105"
                    />
                    {/* 재생 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover/thumb:bg-black/40">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF0000]/90 shadow-lg transition-transform group-hover/thumb:scale-110">
                        <Play size={20} className="ml-0.5 text-white" fill="white" />
                      </div>
                    </div>

                    {/* LIVE 인디케이터: 썸네일 좌상단에 빨간 LIVE 표시 */}
                    {v.is_live && (
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 shadow-md">
                        {/* 깜빡이는 빨간 점 */}
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                        </span>
                        <span className="text-[11px] font-bold text-white">LIVE</span>
                      </div>
                    )}

                  </button>
                )}
              </div>

              {/* 영상 정보 */}
              <div className="mt-2 px-0.5">
                <h3 className="text-sm font-bold text-[#111827] line-clamp-2 leading-tight">
                  {v.title}
                </h3>
                {/* 뱃지 목록 + 날짜 */}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {v.badges.map((badge) => {
                    const style = getBadgeStyle(badge);
                    return (
                      <span
                        key={badge}
                        className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}
                      >
                        {/* LIVE 뱃지: 깜빡이는 점 */}
                        {style.icon === "pulse" && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                        )}
                        {/* HOT 뱃지: 불꽃 아이콘 */}
                        {style.icon === "flame" && (
                          <Flame size={10} className="text-white" />
                        )}
                        {badge}
                      </span>
                    );
                  })}
                  <span className="text-xs text-[#9CA3AF]">
                    {formatDate(v.published_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
