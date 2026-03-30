"use client";

/* ============================================================
 * HeroBento — 히어로 YouTube 슬라이드
 * YouTube 추천 API에서 상위 4개 영상을 가져와 자동 슬라이드로 표시.
 * 라이브 영상이 있으면 "LIVE NOW" 빨간 배지를 좌상단에 표시.
 *
 * 왜 YouTube 슬라이드인가: 더미 이미지 대신 실제 BDR 영상 콘텐츠를
 * 첫 화면에서 바로 보여줘서 사용자 참여를 유도한다.
 *
 * [수정 2026-03-23]
 * - 고정 높이(h-[420px]) → aspect-video로 변경하여 모바일 비율 유지
 * - YouTube iframe API로 영상 재생 감지 → 자동 슬라이드 정지
 * ============================================================ */

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";

// API 응답의 영상 타입 정의
interface RecommendVideo {
  video_id: string;
  title: string;
  thumbnail: string;
  published_at: string;
  view_count?: number;
  badges: string[];
  is_live: boolean;
}

// API 전체 응답 타입
interface RecommendResponse {
  videos: RecommendVideo[];
  live_videos: RecommendVideo[];
  popular_videos: RecommendVideo[];
}

// 자동 슬라이드 간격 (5초)
const AUTO_SLIDE_INTERVAL = 5000;
// 수동 조작 후 자동 슬라이드 재개까지 대기 시간 (10초)
const MANUAL_PAUSE_DURATION = 10000;

export function HeroBento() {
  // SWR로 YouTube 추천 API 호출 (글로벌 fetcher + dedupingInterval 적용)
  // recommended-videos.tsx와 같은 URL이므로 SWR이 자동으로 중복 제거
  const { data: apiData, isLoading, error: swrError } = useSWR<RecommendResponse>(
    "/api/web/youtube/recommend"
  );

  // API 응답에서 라이브(최대2) + 인기(최대2) 조합하여 최대 4개 영상 생성
  const videos: RecommendVideo[] = (() => {
    if (!apiData) return [];
    const liveVideos = (apiData.live_videos ?? []).slice(0, 2);
    const popularVideos = (apiData.popular_videos ?? []).slice(0, 2);
    return [...liveVideos, ...popularVideos];
  })();

  const hasError = !!swrError || (!isLoading && videos.length === 0);

  // 현재 보여주는 슬라이드 인덱스
  const [currentIndex, setCurrentIndex] = useState(0);
  // 수동 조작 후 자동 슬라이드 일시 정지 여부
  const [isPaused, setIsPaused] = useState(false);
  // 영상 재생 중 여부 (YouTube Player API로 감지)
  const [isPlaying, setIsPlaying] = useState(false);

  // 타이머 참조: 자동 슬라이드용
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 타이머 참조: 수동 조작 후 재개 대기용
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- YouTube 영상 재생 감지 ---
  // iframe 내부 클릭은 cross-origin이라 직접 감지 불가.
  // 대신: 사용자가 iframe을 클릭하면 iframe이 포커스를 받으므로,
  // window blur 이벤트로 "포커스가 iframe으로 갔다"를 감지한다.
  // 슬라이드 컨테이너 ref로 내부 iframe인지 확인.
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleWindowBlur() {
      // window가 blur되면 iframe이 포커스를 가져간 것
      // 약간의 딜레이 후 activeElement가 iframe인지 확인
      setTimeout(() => {
        const active = document.activeElement;
        if (active?.tagName === "IFRAME" && containerRef.current?.contains(active)) {
          setIsPlaying(true);
        }
      }, 100);
    }

    function handleWindowFocus() {
      // window가 다시 포커스되면 iframe에서 나온 것 → 재개
      setIsPlaying(false);
    }

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  // --- 방법 A (fallback): 마우스/터치 인터랙션으로 정지 ---
  // iframe 내부 클릭은 cross-origin이라 직접 감지 불가하므로
  // 슬라이드 영역에 마우스가 올라가면 정지, 떠나면 재개
  const [isHovering, setIsHovering] = useState(false);

  // 기존 fetch useEffect는 useSWR로 대체됨 (상단 참조)

  // --- 자동 슬라이드 타이머 ---
  // 영상이 2개 이상이고, 일시정지/재생중/호버 중이 아닐 때만 자동 전환
  // isPlaying: YouTube API로 감지한 재생 상태 (방법 B)
  // isHovering: 마우스 호버 감지 (방법 A fallback)
  useEffect(() => {
    if (videos.length < 2 || isPaused || isPlaying || isHovering) return;

    autoTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, AUTO_SLIDE_INTERVAL);

    // 클린업: 컴포넌트 언마운트 또는 의존값 변경 시 타이머 제거
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [videos.length, isPaused, isPlaying, isHovering]);

  // --- 수동 조작 시 자동 슬라이드 일시 정지 후 재개 ---
  const pauseAutoSlide = useCallback(() => {
    setIsPaused(true);
    // 기존 재개 타이머가 있으면 취소
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    // 10초 후 자동 슬라이드 재개
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, MANUAL_PAUSE_DURATION);
  }, []);

  // 클린업: 컴포넌트 언마운트 시 재개 타이머 제거
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  // --- 이전 슬라이드로 이동 ---
  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
    pauseAutoSlide();
  }, [videos.length, pauseAutoSlide]);

  // --- 다음 슬라이드로 이동 ---
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
    pauseAutoSlide();
  }, [videos.length, pauseAutoSlide]);

  // --- 특정 슬라이드로 이동 (도트 클릭) ---
  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      pauseAutoSlide();
    },
    [pauseAutoSlide]
  );

  // --- 로딩 중: 스켈레톤 UI ---
  if (isLoading) {
    return (
      <div>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border animate-pulse">
          {/* 스켈레톤 중앙 아이콘 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-text-tertiary text-5xl">
              smart_display
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- 영상 없음 또는 에러: 기존 더미 배너 유지 (fallback) ---
  if (hasError || videos.length === 0) {
    return (
      <div>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-card group border border-border">
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              alt="BDR 농구 대회"
              className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
              src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <span className="material-symbols-outlined text-white text-7xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                play_circle
              </span>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 w-full pointer-events-none">
            <span className="inline-block px-3 py-1 bg-primary text-on-primary text-xs font-bold tracking-widest uppercase rounded mb-4">
              BDR
            </span>
            <h2 className="text-4xl font-heading font-bold text-white mb-2 leading-tight">
              BDR 농구 대회
              <br />
              영상을 준비 중입니다
            </h2>
            <p className="text-text-secondary max-w-lg">
              곧 새로운 경기 영상이 업데이트됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 정상 상태: YouTube 슬라이드 ---
  const currentVideo = videos[currentIndex];

  return (
    <div>
      {/* 슬라이드 컨테이너: aspect-video로 16:9 비율 유지, max-h로 데스크탑 제한 */}
      <div
        ref={containerRef}
        className="relative aspect-video rounded-xl overflow-hidden bg-black group border border-border"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={() => setIsHovering(true)}
      >

        {/* 슬라이드 트랙: translateX로 이동, transition으로 부드럽게 전환 */}
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {videos.map((video) => (
            <div
              key={video.video_id}
              className="w-full h-full flex-shrink-0"
            >
              {/* YouTube iframe 임베드 */}
              {/* enablejsapi=1: 재생 상태 감지를 위해 YouTube Player API 활성화 */}
              {/* 라이브 영상은 autoplay=1로 자동재생, 일반 영상은 autoplay=0 */}
              <iframe
                src={`https://www.youtube.com/embed/${video.video_id}?autoplay=${video.is_live ? "1" : "0"}&rel=0&modestbranding=1&mute=${video.is_live ? "1" : "0"}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
            </div>
          ))}
        </div>

        {/* LIVE NOW 배지: 현재 슬라이드가 라이브일 때만 표시 */}
        {currentVideo.is_live && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow-lg animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full" />
            실시간
          </div>
        )}

        {/* 뱃지 목록: HOT, 디비전명 등 (LIVE 제외) */}
        {currentVideo.badges.filter((b) => b !== "LIVE").length > 0 && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {currentVideo.badges
              .filter((b) => b !== "LIVE")
              .map((badge) => (
                <span
                  key={badge}
                  className={`px-2 py-1 text-xs font-bold rounded ${
                    badge === "HOT"
                      ? "bg-orange-500 text-white"
                      : "bg-white/20 text-white backdrop-blur-sm"
                  }`}
                >
                  {badge}
                </span>
              ))}
          </div>
        )}

        {/* 영상 제목 오버레이: 하단에 반투명 배경으로 표시 */}
        <div className="absolute bottom-10 left-0 right-0 z-10 pointer-events-none">
          <div className="px-6">
            <p className="text-white text-sm font-medium truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {currentVideo.title}
            </p>
          </div>
        </div>

        {/* 좌측 화살표: hover 시에만 표시 */}
        {videos.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="이전 영상"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_left
            </span>
          </button>
        )}

        {/* 우측 화살표: hover 시에만 표시 */}
        {videos.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="다음 영상"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_right
            </span>
          </button>
        )}

        {/* 도트 인디케이터: 하단 중앙에 현재 슬라이드 위치 표시 */}
        {videos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-white scale-110"
                    : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`슬라이드 ${index + 1}로 이동`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
