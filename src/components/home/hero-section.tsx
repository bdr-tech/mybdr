"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
// lucide-react 제거 → Material Symbols Outlined 사용
import { PersonalHero } from "./personal-hero";

// --- 유튜브 API 응답 타입 ---
interface VideoItem {
  video_id: string;
  title: string;
  thumbnail: string;
  published_at: string;
  badges: string[];
  is_live: boolean;
}

// --- 하드코딩 광고 슬라이드 데이터 ---
const ADS = [
  {
    id: "ad-1",
    title: "BDR 스타터스리그\n시즌 3 참가팀 모집",
    subtitle: "3x3 토너먼트 / 참가비 3만원",
    cta: "신청하기",
    href: "/tournaments",
    gradient: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
  },
  {
    id: "ad-2",
    title: "BDR Performance\n프리미엄 멤버십",
    subtitle: "팀 생성 · 대회 관리 · 통계 분석",
    cta: "자세히 보기",
    href: "/pricing",
    gradient: "linear-gradient(135deg, var(--color-accent), var(--color-secondary))",
  },
  {
    id: "ad-3",
    title: "강남 농구 코트\n예약 서비스 오픈",
    subtitle: "실시간 빈 코트 확인 · 간편 예약",
    cta: "코트 찾기",
    href: "#",
    gradient: "linear-gradient(135deg, var(--color-surface-high), var(--color-surface-bright))",
  },
];

// --- 슬라이드 아이템 타입 ---
interface SlideItem {
  id: string;
  type: "youtube-live" | "youtube-hot" | "ad";
  // 유튜브 슬라이드용 필드
  video?: VideoItem;
  // 광고 슬라이드용 필드
  ad?: (typeof ADS)[number];
}

/* ============================================================
 * HeroSection — 2분할 레이아웃 (좌: 메인 슬라이드, 우: 개인 맞춤 카드)
 * - 데스크탑: grid-cols-3 (좌 2칸 + 우 1칸)
 * - 모바일: 세로 스택 (메인 위, 개인 카드 아래)
 * ============================================================ */
export function HeroSection() {
  const [state, setState] = useState<"loading" | "logged-in" | "guest">("loading");
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);

  // 유튜브 영상 데이터
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);

  // 대시보드 데이터 fetch (로그인 상태 확인용)
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch("/api/web/dashboard", { credentials: "include", signal: controller.signal })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setDashboardData(data);
          setState("logged-in");
        } else {
          setState("guest");
        }
      })
      .catch(() => setState("guest"))
      .finally(() => clearTimeout(timeout));
  }, []);

  // 유튜브 API 호출 → 슬라이드 구성
  useEffect(() => {
    fetch("/api/web/youtube/recommend", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        const videos: VideoItem[] = data?.videos ?? [];
        const builtSlides: SlideItem[] = [];

        // 1순위: 라이브 영상 (is_live === true인 첫 번째)
        const liveVideo = videos.find((v) => v.is_live);
        if (liveVideo) {
          builtSlides.push({
            id: `yt-live-${liveVideo.video_id}`,
            type: "youtube-live",
            video: liveVideo,
          });
        }

        // 2순위: 주간 인기 영상 (is_live === false인 첫 번째, 이미 조회수순 정렬)
        const hotVideo = videos.find((v) => !v.is_live);
        if (hotVideo) {
          builtSlides.push({
            id: `yt-hot-${hotVideo.video_id}`,
            type: "youtube-hot",
            video: hotVideo,
          });
        }

        // 3순위: 하드코딩 광고 슬라이드
        ADS.forEach((ad) => {
          builtSlides.push({ id: ad.id, type: "ad", ad });
        });

        setSlides(builtSlides);
      })
      .catch(() => {
        // 유튜브 API 실패 시 → 광고 슬라이드만 표시 (graceful degradation)
        setSlides(ADS.map((ad) => ({ id: ad.id, type: "ad" as const, ad })));
      });
  }, []);

  const totalSlides = slides.length;

  const nextSlide = useCallback(
    () => setCurrentSlide((p) => (p + 1) % totalSlides),
    [totalSlides]
  );
  const prevSlide = useCallback(
    () => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides),
    [totalSlides]
  );

  // 5초 간격 자동 전환, 호버 시 정지
  useEffect(() => {
    if (totalSlides === 0 || isHovered) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [totalSlides, isHovered, nextSlide]);

  // 모바일 스와이프 지원
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide();
    }
  };

  // 로딩 스켈레톤
  if (state === "loading") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 좌측 스켈레톤: 부모 높이에 맞춤 (aspect-ratio 제거) */}
        <div className="h-[280px] animate-pulse rounded-2xl bg-surface-low sm:h-[320px] md:col-span-2 md:h-[400px] lg:h-[440px]" />
        {/* 우측 스켈레톤: 모바일 200px, 데스크탑은 부모 높이 */}
        <div className="h-[200px] animate-pulse rounded-2xl bg-surface-low md:h-[400px] lg:h-[440px]" />
      </div>
    );
  }

  return (
    /* 전체 히어로: 고정 높이 + 2분할 그리드 (aspect-ratio 제거) */
    <section className="grid h-[280px] grid-cols-1 gap-4 sm:h-[320px] md:h-[400px] md:grid-cols-3 lg:h-[440px]">
      {/* === 좌측: 메인 슬라이드 (md:col-span-2) === */}
      <div
        className="relative h-full overflow-hidden rounded-2xl bg-surface-low md:col-span-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 슬라이드 콘텐츠 영역 */}
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-all duration-500"
            style={{
              opacity: i === currentSlide ? 1 : 0,
              pointerEvents: i === currentSlide ? "auto" : "none",
            }}
          >
            {/* 유튜브 슬라이드 (라이브 또는 인기 영상) */}
            {(slide.type === "youtube-live" || slide.type === "youtube-hot") &&
              slide.video && (
                <YoutubeSlide video={slide.video} isLive={slide.type === "youtube-live"} />
              )}

            {/* 광고 슬라이드 */}
            {slide.type === "ad" && slide.ad && <AdSlide ad={slide.ad} />}
          </div>
        ))}

        {/* 슬라이드가 없을 때 기본 히어로 표시 */}
        {slides.length === 0 && <FallbackHero />}

        {/* 하단 dots 인디케이터 */}
        {totalSlides > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === currentSlide ? "1.5rem" : "0.375rem",
                  backgroundColor:
                    i === currentSlide
                      ? "var(--color-primary)"
                      : "var(--color-surface-bright)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* === 우측: 개인 맞춤 카드 (md:col-span-1) === */}
      {/* 우측 개인 카드: 모바일 200px 고정, 데스크탑 부모 높이 채움 */}
      <div className="h-[200px] md:h-full">
        {state === "logged-in" && dashboardData ? (
          /* 로그인 상태: 기존 PersonalHero 재사용 (h-full로 높이 맞춤) */
          <PersonalHero preloadedData={dashboardData} />
        ) : (
          /* 비로그인 상태: 로그인 유도 카드 */
          <PersonalHero />
        )}
      </div>
    </section>
  );
}

/* ============================================================
 * YoutubeSlide — 유튜브 영상 슬라이드
 * - 썸네일 배경 + gradient 오버레이 + 좌측 하단 정보
 * ============================================================ */
function YoutubeSlide({ video, isLive }: { video: VideoItem; isLive: boolean }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.video_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full w-full"
    >
      {/* 유튜브 썸네일 배경 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url(${video.thumbnail})` }}
      />

      {/* gradient 오버레이: 하단에서 상단으로 surface색 그라디언트 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--color-surface) 0%, rgba(28,27,27,0.4) 40%, transparent 100%)",
        }}
      />

      {/* 좌측 하단 정보 영역 */}
      <div className="absolute bottom-0 left-0 w-full space-y-3 p-6 md:w-2/3 md:p-8">
        {/* 뱃지 영역 */}
        <div className="flex items-center gap-2">
          {isLive ? (
            /* LIVE NOW 뱃지: 빨간 배경 + 깜빡이는 점 */
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {/* 깜빡이는 라이브 인디케이터 */}
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              LIVE NOW
            </span>
          ) : (
            /* HOT / badges 표시 (라이브가 아닌 경우) */
            <>
              {video.badges.map((badge) => (
                <span
                  key={badge}
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
                  style={{
                    backgroundColor:
                      badge === "HOT"
                        ? "var(--color-primary)"
                        : "var(--color-accent)",
                  }}
                >
                  {badge === "HOT" && <span className="material-symbols-outlined text-[10px]">local_fire_department</span>}
                  {badge}
                </span>
              ))}
            </>
          )}
        </div>

        {/* 영상 제목: 대형 타이포 */}
        <h2
          className="text-2xl font-bold leading-tight tracking-tighter md:text-4xl"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)",
          }}
        >
          {video.title}
        </h2>

        {/* CTA: "시청하기" 버튼 */}
        <div className="pt-2">
          <span
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-transform group-hover:scale-105"
            style={{
              background:
                "linear-gradient(to right, var(--color-primary), var(--color-accent))",
            }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            시청하기
          </span>
        </div>
      </div>
    </a>
  );
}

/* ============================================================
 * AdSlide — 하드코딩 광고 슬라이드
 * - 그라디언트 배경 + 대형 타이포 + CTA 버튼
 * ============================================================ */
function AdSlide({ ad }: { ad: (typeof ADS)[number] }) {
  return (
    <div className="relative h-full w-full" style={{ background: ad.gradient }}>
      {/* 장식용 농구공 패턴 (우측 하단, 반투명) */}
      <div className="absolute -bottom-10 -right-10 text-[200px] leading-none opacity-[0.06] select-none">
        &nbsp;
      </div>

      {/* 광고 콘텐츠: 좌측 하단 배치 */}
      <div className="absolute bottom-0 left-0 w-full space-y-3 p-6 md:w-2/3 md:p-8">
        {/* 광고 제목: 줄바꿈 포함 */}
        <h2
          className="whitespace-pre-line text-2xl font-bold leading-tight tracking-tighter md:text-4xl"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)",
          }}
        >
          {ad.title}
        </h2>

        {/* 부제 */}
        <p className="text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
          {ad.subtitle}
        </p>

        {/* CTA 버튼 */}
        <div className="pt-2">
          <Link
            href={ad.href}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
          >
            {ad.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * FallbackHero — 슬라이드가 없을 때 기본 히어로
 * (유튜브 API 실패 + 광고도 로드되기 전 찰나에 표시)
 * ============================================================ */
function FallbackHero() {
  return (
    <div
      className="flex h-full items-end p-6 md:p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(227,27,35,0.15) 0%, rgba(27,60,135,0.12) 50%, rgba(19,19,19,0.9) 100%)",
      }}
    >
      <div className="space-y-3">
        <h2
          className="text-3xl font-bold tracking-tighter md:text-5xl"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)",
          }}
        >
          <span style={{ color: "var(--color-primary)" }}>B</span>asketball{" "}
          <span style={{ color: "var(--color-primary)" }}>D</span>aily{" "}
          <span style={{ color: "var(--color-primary)" }}>R</span>outine
        </h2>
        <p style={{ color: "var(--color-text-secondary)" }}>농구인을 위한 플랫폼</p>
      </div>
    </div>
  );
}
