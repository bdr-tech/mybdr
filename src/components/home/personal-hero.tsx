"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Calendar, MapPin, Trophy, Users, Flame, ChevronLeft, ChevronRight } from "lucide-react";

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

// --- Slide Components ---
function SlideNextGame({ data }: { data: DashboardData["next_game"] }) {
  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <Calendar className="mb-2 text-[#1B3C87]" size={32} />
        <p className="text-sm font-bold text-[#111827]">예정된 경기가 없어요</p>
        <p className="mt-1 text-xs text-[#6B7280]">새로운 경기를 찾아보세요!</p>
        <Link href="/games" className="mt-3 rounded-full bg-[#1B3C87] px-4 py-2 text-xs font-semibold text-white">
          경기 찾기
        </Link>
      </div>
    );
  }
  return (
    <Link href={`/games/${data.uuid?.slice(0, 8) ?? ""}`} className="flex h-full flex-col justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-[#E31B23] px-2.5 py-0.5 text-[10px] font-bold text-white">
            {dDay(data.scheduled_at)}
          </span>
          <span className="text-[10px] font-medium text-[#6B7280]">내 다음 경기</span>
        </div>
        <h3 className="text-base font-bold text-[#111827] line-clamp-2">{data.title}</h3>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <Calendar size={13} />
          <span>{formatDate(data.scheduled_at)} {formatTime(data.scheduled_at)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <MapPin size={13} />
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
        <Flame className="mb-2 text-[#E31B23]" size={32} />
        <p className="text-sm font-bold text-[#111827]">아직 기록이 없어요</p>
        <p className="mt-1 text-xs text-[#6B7280]">대회에 참가하면 스탯이 기록됩니다</p>
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
        <div className="mb-2 flex items-center gap-2">
          <Flame size={14} className="text-[#E31B23]" />
          <span className="text-[10px] font-medium text-[#6B7280]">내 최근 스탯</span>
        </div>
        {data.tournament_name && (
          <p className="mb-1 text-xs text-[#6B7280]">
            {data.tournament_name} · {formatDate(data.match_date)}
          </p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-xl font-black text-[#1B3C87]">{s.value}</p>
            <p className="text-[10px] text-[#6B7280]">{s.label}</p>
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
        <Users className="mb-2 text-[#1B3C87]" size={32} />
        <p className="text-sm font-bold text-[#111827]">소속 팀이 없어요</p>
        <p className="mt-1 text-xs text-[#6B7280]">팀에 가입하거나 새로 만들어보세요</p>
        <Link href="/teams" className="mt-3 rounded-full bg-[#1B3C87] px-4 py-2 text-xs font-semibold text-white">
          팀 찾기
        </Link>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="mb-2 flex items-center gap-2">
        <Users size={14} className="text-[#1B3C87]" />
        <span className="text-[10px] font-medium text-[#6B7280]">내 팀 전적</span>
      </div>
      <div className="space-y-2">
        {teams.map((t) => {
          const total = t.wins + t.losses;
          const winRate = total > 0 ? Math.round((t.wins / total) * 100) : 0;
          return (
            <Link key={t.id} href={`/teams/${t.id}`} className="flex items-center gap-3 rounded-md bg-white/60 px-3 py-2">
              <div
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: t.color || "#1B3C87" }}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-[#111827]">{t.name}</p>
                <p className="text-[10px] text-[#6B7280]">{t.wins}승 {t.losses}패</p>
              </div>
              <span className="text-sm font-black text-[#1B3C87]">{winRate}%</span>
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
        <Trophy className="mb-2 text-[#E31B23]" size={32} />
        <p className="text-sm font-bold text-[#111827]">참가 중인 대회가 없어요</p>
        <p className="mt-1 text-xs text-[#6B7280]">대회에 참가해서 실력을 겨뤄보세요</p>
        <Link href="/tournaments" className="mt-3 rounded-full bg-[#E31B23] px-4 py-2 text-xs font-semibold text-white">
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
        <div className="mb-2 flex items-center gap-2">
          <Trophy size={14} className="text-[#E31B23]" />
          <span className="text-[10px] font-medium text-[#6B7280]">참가 중인 대회</span>
        </div>
        <h3 className="text-base font-bold text-[#111827] line-clamp-2">{data.name}</h3>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full bg-[#1B3C87] px-2.5 py-0.5 text-[10px] font-bold text-white">
          {STATUS_KR[data.status ?? ""] ?? data.status}
        </span>
        {data.team_name && (
          <span className="text-xs text-[#6B7280]">{data.team_name}</span>
        )}
        {data.start_date && (
          <span className="text-xs text-[#6B7280]">{formatDate(data.start_date)}</span>
        )}
      </div>
    </Link>
  );
}

function SlideRecommended({ games }: { games: DashboardData["recommended_games"] }) {
  if (games.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <MapPin className="mb-2 text-[#1B3C87]" size={32} />
        <p className="text-sm font-bold text-[#111827]">추천 경기가 없어요</p>
        <p className="mt-1 text-xs text-[#6B7280]">프로필에 지역을 설정하면 맞춤 추천해드려요</p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="mb-2 flex items-center gap-2">
        <MapPin size={14} className="text-[#1B3C87]" />
        <span className="text-[10px] font-medium text-[#6B7280]">내 지역 추천 경기</span>
      </div>
      <div className="space-y-2">
        {games.slice(0, 2).map((g, i) => (
          <Link
            key={i}
            href={`/games/${g.uuid?.slice(0, 8) ?? ""}`}
            className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#111827]">{g.title}</p>
              <p className="text-[10px] text-[#6B7280]">
                {formatDate(g.scheduled_at)} {formatTime(g.scheduled_at)} · {g.venue_name ?? g.city}
              </p>
            </div>
            {g.spots_left !== null && (
              <span className="ml-2 whitespace-nowrap rounded-full bg-[#E31B23]/10 px-2 py-0.5 text-[10px] font-bold text-[#E31B23]">
                {g.spots_left}자리
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---
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
      <div className="h-[120px] animate-pulse rounded-[20px] bg-gradient-to-br from-[#1B3C87]/10 to-[#E31B23]/5 border border-[#E8ECF0]" />
    );
  }

  if (!data) return null; // Not logged in — parent will show static hero

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1B3C87]/10 to-[#E31B23]/8 border border-[#E8ECF0]"
      style={{ background: "var(--hero-bg, linear-gradient(135deg, rgba(27,60,135,0.10), rgba(227,27,35,0.08)))" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slide area */}
      <div className="relative h-[92px] px-4 py-2.5">
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            className="absolute inset-0 px-4 py-2.5 transition-all duration-300"
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

      {/* Navigation arrows (desktop) */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-1 shadow-sm backdrop-blur-sm md:block"
      >
        <ChevronLeft size={16} className="text-[#1B3C87]" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-1 shadow-sm backdrop-blur-sm md:block"
      >
        <ChevronRight size={16} className="text-[#1B3C87]" />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 pb-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-4 bg-[#1B3C87]" : "w-1.5 bg-[#1B3C87]/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
