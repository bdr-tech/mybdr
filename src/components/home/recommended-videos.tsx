"use client";

import { useState, useEffect, useRef } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoItem {
  video_id: string;
  title: string;
  thumbnail: string;
  published_at: string;
  reason: string;
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
                  </button>
                )}
              </div>

              {/* 영상 정보 */}
              <div className="mt-2 px-0.5">
                <h3 className="text-sm font-bold text-[#111827] line-clamp-2 leading-tight">
                  {v.title}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-[6px] bg-[#E31B23]/10 px-2 py-0.5 text-[11px] font-semibold text-[#E31B23]">
                    {v.reason}
                  </span>
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
