"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
// lucide-react 제거 → Material Symbols Outlined 사용

// --- Types ---
interface DashboardData {
  next_game: {
    title: string;
    scheduled_at: string | null;
    venue_name: string | null;
    city: string | null;
    game_type: string | null;
    uuid: string | null;
  } | null;
  recent_stats: {
    points: number | null;
    rebounds: number | null;
    assists: number | null;
    steals: number | null;
    blocks: number | null;
    minutes: number | null;
    match_date: string | null;
    tournament_name: string | null;
  } | null;
  my_teams: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    color: string | null;
  }[];
  active_tournament: {
    id: string;
    name: string;
    status: string | null;
    team_name: string | null;
    start_date: string | null;
  } | null;
  recommended_games: {
    uuid: string | null;
    title: string | null;
    scheduled_at: string | null;
    venue_name: string | null;
    city: string | null;
    spots_left: number | null;
    game_type: string | null;
  }[];
}

// --- Helpers ---
function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });
}
function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}
function dDay(iso: string | null): string {
  if (!iso) return "";
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return "";
}

/* ============================================================
 * Slide Components — Kinetic Pulse 스타일
 * - No-Line 규칙: 보더 없이 surface 계층으로 구분
 * - 텍스트: 따뜻한 톤 (text-primary, text-secondary, text-muted)
 * - 강조: primary(Red)는 가장 중요한 뱃지에만 사용
 * ============================================================ */

function SlideNextGame({ data }: { data: DashboardData["next_game"] }) {
  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        {/* 아이콘 24px로 축소 (좁은 공간 최적화) */}
        <span className="material-symbols-outlined mb-1.5 text-2xl" style={{ color: "var(--color-primary)" }}>calendar_today</span>
        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>예정된 경기가 없어요</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>새로운 경기를 찾아보세요!</p>
        {/* CTA 버튼: 좁은 칸에 맞게 작게 */}
        <Link
          href="/games"
          className="mt-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
          style={{ background: "linear-gradient(to right, var(--color-primary), var(--color-accent))" }}
        >
          경기 찾기
        </Link>
      </div>
    );
  }
  return (
    <Link href={`/games/${data.uuid?.slice(0, 8) ?? ""}`} className="flex h-full flex-col justify-between">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          {/* D-Day 뱃지: 좁은 칸 최적화 (px-2, text-[10px]) */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: "var(--color-primary)", color: "#FFFFFF" }}
          >
            {dDay(data.scheduled_at)}
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>내 다음 경기</span>
        </div>
        {/* 제목: text-sm + line-clamp-1 (좁은 공간에서 잘림 방지) */}
        <h3 className="text-sm font-bold line-clamp-1" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>{data.title}</h3>
      </div>
      <div className="mt-1.5 space-y-0.5">
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          <span className="material-symbols-outlined text-xs">calendar_today</span>
          <span>{formatDate(data.scheduled_at)} {formatTime(data.scheduled_at)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          <span className="material-symbols-outlined text-xs">location_on</span>
          <span className="truncate">{[data.city, data.venue_name].filter(Boolean).join(" ")}</span>
        </div>
      </div>
    </Link>
  );
}

function SlideRecentStats({ data }: { data: DashboardData["recent_stats"] }) {
  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        {/* 아이콘 24px로 축소 */}
        <span className="material-symbols-outlined mb-1.5 text-2xl" style={{ color: "var(--color-primary)" }}>local_fire_department</span>
        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>아직 기록이 없어요</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>대회에 참가하면 스탯이 기록됩니다</p>
      </div>
    );
  }
  const stats = [
    { label: "득점", value: data.points ?? 0 },
    { label: "리바운드", value: data.rebounds ?? 0 },
    { label: "어시스트", value: data.assists ?? 0 },
    { label: "스틸", value: data.steals ?? 0 },
  ];
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ color: "var(--color-primary)" }}>local_fire_department</span>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>내 최근 스탯</span>
        </div>
        {data.tournament_name && (
          <p className="mb-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
            {data.tournament_name} · {formatDate(data.match_date)}
          </p>
        )}
      </div>
      {/* 스탯 그리드: gap-1로 줄이고 숫자 text-lg, 라벨 text-[10px] */}
      <div className="grid grid-cols-4 gap-1">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-lg font-black" style={{ color: "var(--color-text-primary)" }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideMyTeams({ teams }: { teams: DashboardData["my_teams"] }) {
  if (teams.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined mb-1.5 text-2xl" style={{ color: "var(--color-accent)" }}>group</span>
        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>소속 팀이 없어요</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>팀에 가입하거나 새로 만들어보세요</p>
        <Link
          href="/teams"
          className="mt-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
          style={{ background: "linear-gradient(to right, var(--color-primary), var(--color-accent))" }}
        >
          팀 찾기
        </Link>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm" style={{ color: "var(--color-accent)" }}>group</span>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>내 팀 전적</span>
      </div>
      {/* 팀 리스트: py-1.5, 아이콘 h-6 w-6, 텍스트 text-xs로 축소 */}
      <div className="space-y-1.5">
        {teams.map((t) => {
          const total = t.wins + t.losses;
          const winRate = total > 0 ? Math.round((t.wins / total) * 100) : 0;
          return (
            <Link key={t.id} href={`/teams/${t.id}`} className="flex items-center gap-2 rounded-lg bg-surface-high px-2 py-1.5 transition-colors hover:bg-surface-bright">
              <div
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: t.color || "var(--color-accent)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{t.name}</p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{t.wins}승 {t.losses}패</p>
              </div>
              <span className="text-xs font-black" style={{ color: "var(--color-primary)" }}>{winRate}%</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SlideActiveTournament({ data }: { data: DashboardData["active_tournament"] }) {
  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined mb-1.5 text-2xl" style={{ color: "var(--color-primary)" }}>emoji_events</span>
        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>참가 중인 대회가 없어요</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>대회에 참가해서 실력을 겨뤄보세요</p>
        <Link
          href="/tournaments"
          className="mt-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
          style={{ background: "linear-gradient(to right, var(--color-primary), var(--color-accent))" }}
        >
          대회 둘러보기
        </Link>
      </div>
    );
  }
  const STATUS_KR: Record<string, string> = {
    ongoing: "진행중",
    registration_open: "모집중",
    active: "진행중",
  };
  return (
    <Link href={`/tournaments/${data.id}`} className="flex h-full flex-col justify-between">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ color: "var(--color-primary)" }}>emoji_events</span>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>참가 중인 대회</span>
        </div>
        {/* 대회명: text-sm + line-clamp-1 (좁은 공간 최적화) */}
        <h3 className="text-sm font-bold line-clamp-1" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>{data.name}</h3>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {/* 상태 뱃지: text-[10px]로 축소 */}
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ backgroundColor: "var(--color-primary)", color: "#FFFFFF" }}
        >
          {STATUS_KR[data.status ?? ""] ?? data.status}
        </span>
        {data.team_name && (
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{data.team_name}</span>
        )}
        {data.start_date && (
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{formatDate(data.start_date)}</span>
        )}
      </div>
    </Link>
  );
}

function SlideRecommended({ games }: { games: DashboardData["recommended_games"] }) {
  if (games.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined mb-1.5 text-2xl" style={{ color: "var(--color-accent)" }}>location_on</span>
        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>추천 경기가 없어요</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>프로필에 지역을 설정하면 맞춤 추천해드려요</p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm" style={{ color: "var(--color-accent)" }}>location_on</span>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>내 지역 추천 경기</span>
      </div>
      {/* 추천 경기 리스트: px-2 py-1.5, 텍스트 text-xs로 축소 */}
      <div className="space-y-1.5">
        {games.slice(0, 2).map((g, i) => (
          <Link
            key={i}
            href={`/games/${g.uuid?.slice(0, 8) ?? ""}`}
            className="flex items-center justify-between rounded-lg bg-surface-high px-2 py-1.5 transition-colors hover:bg-surface-bright"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{g.title}</p>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                {formatDate(g.scheduled_at)} {formatTime(g.scheduled_at)} · {g.venue_name ?? g.city}
              </p>
            </div>
            {g.spots_left !== null && (
              <span
                className="ml-1.5 whitespace-nowrap rounded-lg px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
              >
                {g.spots_left}자리
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * PersonalHero — 메인 컴포넌트
 * Kinetic Pulse 스타일: rounded-2xl, surface-low 배경
 * No-Line 규칙: 보더 제거, surface 계층으로 구분
 * ============================================================ */
export function PersonalHero({ preloadedData }: { preloadedData?: Record<string, unknown> | null }) {
  const [data, setData] = useState<DashboardData | null>(
    preloadedData ? (preloadedData as unknown as DashboardData) : null
  );
  const [loading, setLoading] = useState(!preloadedData);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preloadedData) return; // 이미 데이터 있으면 중복 호출 안 함
    fetch("/api/web/dashboard", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [preloadedData]);

  const slides = data
    ? [
        { key: "next-game", node: <SlideNextGame data={data.next_game} /> },
        { key: "stats", node: <SlideRecentStats data={data.recent_stats} /> },
        { key: "teams", node: <SlideMyTeams teams={data.my_teams} /> },
        { key: "tournament", node: <SlideActiveTournament data={data.active_tournament} /> },
        { key: "recommended", node: <SlideRecommended games={data.recommended_games} /> },
      ]
    : [];

  const total = slides.length;

  const next = useCallback(() => setCurrent((p) => (p + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + total) % total), [total]);

  // Auto-rotate every 5s
  useEffect(() => {
    if (!data || isHovered) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [data, isHovered, next]);

  // Swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  };

  if (loading) {
    return (
      /* 로딩 스켈레톤: h-full로 부모 높이에 맞춤 */
      <div className="h-full min-h-[160px] animate-pulse rounded-2xl bg-surface-low" />
    );
  }

  /* 비로그인 상태: 로그인 유도 카드 (좁은 공간 최적화) */
  if (!data) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center rounded-2xl p-4 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(227,27,35,0.10), rgba(27,60,135,0.06))",
        }}
      >
        {/* 아이콘 축소: 40→28 */}
        <span className="material-symbols-outlined mb-2 text-3xl" style={{ color: "var(--color-primary)" }}>calendar_today</span>
        <h3
          className="text-sm font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          내 경기/스탯을 한눈에
        </h3>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          로그인하고 맞춤 정보를 받아보세요
        </p>
        <Link
          href="/login"
          className="mt-3 rounded-lg px-4 py-2 text-xs font-bold text-white transition-transform active:scale-95"
          style={{ background: "linear-gradient(to right, var(--color-primary), var(--color-accent))" }}
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface-low"
      style={{
        /* 히어로 컨테이너: Red→Navy 미세 그라디언트로 깊이감 */
        background: "linear-gradient(135deg, rgba(227,27,35,0.10), rgba(27,60,135,0.06))",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 슬라이드 영역: flex-1로 남은 공간 채움 (고정 px 제거) */}
      <div className="relative flex-1 px-4 py-3">
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            className="absolute inset-0 px-4 py-3 transition-all duration-300"
            style={{
              opacity: i === current ? 1 : 0,
              pointerEvents: i === current ? "auto" : "none",
              transform: `translateX(${(i - current) * 20}px)`,
            }}
          >
            {slide.node}
          </div>
        ))}
      </div>

      {/* 네비게이션 arrows: 아주 작게 (p-0.5, size 12) — 좁은 공간 최적화 */}
      <button
        onClick={prev}
        className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-md bg-surface-high p-0.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-surface-bright md:block"
      >
        <span className="material-symbols-outlined text-xs" style={{ color: "var(--color-primary)" }}>chevron_left</span>
      </button>
      <button
        onClick={next}
        className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-md bg-surface-high p-0.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-surface-bright md:block"
      >
        <span className="material-symbols-outlined text-xs" style={{ color: "var(--color-primary)" }}>chevron_right</span>
      </button>

      {/* Dots: h-1로 축소, 활성 w-3, 패딩 줄임 */}
      <div className="flex justify-center gap-1 pb-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-1 rounded-full transition-all"
            style={{
              width: i === current ? "0.75rem" : "0.25rem",
              backgroundColor: i === current ? "var(--color-primary)" : "var(--color-surface-bright)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
