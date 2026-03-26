"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferFilter } from "@/contexts/prefer-filter-context";

// API에서 내려오는 경기 데이터 타입 (snake_case로 자동 변환됨) - 기존 유지
interface GameFromApi {
  id: string;
  uuid: string | null;
  title: string | null;
  status: number;
  game_type: number;
  city: string | null;
  venue_name: string | null;
  scheduled_at: string | null;    // ISO string (Date가 아님)
  current_participants: number | null;
  max_participants: number | null;
  fee_per_person: string | null;  // Decimal -> string
  skill_level: string | null;
}

interface GamesApiResponse {
  games: GameFromApi[];
  cities: string[];
}

// 경기 뱃지/라벨 상수 (공통 파일에서 import)
import { TYPE_BADGE, SKILL_BADGE } from "../_constants/game-badges";

/**
 * 상태 배지 계산 - 디자인 시안 기반
 * LIVE (진행중), STARTS SOON (24시간 이내), FULLY BOOKED (인원 가득)
 */
function getStatusBadge(game: GameFromApi): { text: string; className: string } | null {
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const pct = max > 0 ? (cur / max) * 100 : 0;

  // 진행중 -> LIVE 배지 (빨간색 + 깜빡이는 점)
  if (game.status === 3) {
    return { text: "라이브", className: "bg-[var(--color-primary)] text-white" };
  }

  // 인원 가득 -> FULLY BOOKED (회색)
  if (pct >= 100) {
    return { text: "만석", className: "bg-[var(--color-text-disabled)] text-white" };
  }

  // 모집중이고 24시간 이내 시작 -> STARTS SOON (노란색)
  if (game.status === 1 && game.scheduled_at) {
    const scheduledTime = new Date(game.scheduled_at).getTime();
    const now = Date.now();
    const hoursUntilStart = (scheduledTime - now) / (1000 * 60 * 60);
    if (hoursUntilStart > 0 && hoursUntilStart <= 24) {
      return { text: "곧 시작", className: "bg-black text-white" };
    }
  }

  return null;
}

// -- 스켈레톤 UI: 새 카드 디자인에 맞춘 로딩 상태 --
function GamesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)]">
          {/* 이미지 영역 스켈레톤 */}
          {/* 이미지 영역 스켈레톤 -- 모바일 가독성 위해 h-36으로 축소 */}
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-5 w-3/4 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// -- 경기 카드: 디자인 시안(bdr_1, bdr_5)에 맞춘 이미지 카드 --
function GameCard({ game }: { game: GameFromApi }) {
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;
  const badge = TYPE_BADGE[game.game_type] ?? TYPE_BADGE[0];
  const skill = game.skill_level && game.skill_level !== "all" ? SKILL_BADGE[game.skill_level] : null;
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0;
  const location = game.venue_name ?? game.city ?? "";

  // 상태 배지 (LIVE / STARTS SOON / FULLY BOOKED)
  const statusBadge = getStatusBadge(game);
  const isFullyBooked = statusBadge?.text === "만석";

  // Decimal 문자열 -> 포맷된 가격
  const fee = game.fee_per_person && Number(game.fee_per_person) > 0
    ? `\u20A9${Number(game.fee_per_person).toLocaleString()}`
    : null;

  // ISO string -> 한국 시간 포맷
  const timeStr = game.scheduled_at
    ? new Date(game.scheduled_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })
    : "";

  const dateStr = game.scheduled_at
    ? new Date(game.scheduled_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", timeZone: "Asia/Seoul" })
    : "";

  return (
    <Link href={href}>
      {/* 디자인 시안: 이미지 카드 + 호버 시 그림자 */}
      <div className={`group flex flex-col rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] hover:shadow-lg transition-all h-full ${isFullyBooked ? "opacity-70 grayscale" : ""}`}>
        {/* 이미지 영역 -- h-24: 모바일 컴팩트, lg:h-32 데스크탑 */}
        <div className="relative h-24 lg:h-32">
          {/* placeholder 이미지: 경기장 타입별 기본 이미지 */}
          <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-[var(--color-text-muted)] opacity-40">
              sports_basketball
            </span>
          </div>

          {/* 상태 배지 오버레이 (좌상단) */}
          {statusBadge && (
            <div className="absolute top-2 left-2 lg:top-3 lg:left-3 flex gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${statusBadge.className}`}>
                {/* LIVE일 때 깜빡이는 점 */}
                {statusBadge.text === "라이브" && (
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                )}
                {statusBadge.text}
              </span>
            </div>
          )}

          {/* FULLY BOOKED 오버레이 */}
          {isFullyBooked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-black font-black text-xs px-4 py-2 rounded">
                만석
              </span>
            </div>
          )}

          {/* 유형 뱃지 (우상단) */}
          <span
            className="absolute top-2 right-2 lg:top-3 lg:right-3 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>

        {/* 정보 영역 */}
        <div className="p-3 lg:p-4 flex-1 flex flex-col">
          {/* 종목 라벨 */}
          <p className="text-xs text-[var(--color-primary)] font-bold uppercase tracking-wider mb-0.5">
            {badge.label}
          </p>

          {/* 경기 제목 */}
          <h3 className="text-base font-bold mb-2 line-clamp-1 text-[var(--color-text-primary)]">
            {game.title}
          </h3>

          {/* 장소 + 실력 정보 */}
          <div className="space-y-1.5 mb-2">
            {location && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-text-muted)] text-base">
                  location_on
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
                  {location}
                </span>
              </div>
            )}
            {(dateStr || timeStr) && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-text-muted)] text-base">
                  schedule
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {dateStr} {timeStr}
                </span>
              </div>
            )}
            {skill && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-text-muted)] text-base">
                  equalizer
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  실력: {skill.label}
                </span>
              </div>
            )}
          </div>

          {/* 참가 프로그레스 (인원 있을 때만) */}
          {max > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-primary)]">{cur}/{max}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">모집중</span>
                </div>
              </div>
              <div className="w-full bg-[var(--color-border)] h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--color-primary)] h-full rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* 가격 + JOIN 버튼 */}
          <div className="mt-auto pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
            <div>
              {fee && <p className="text-xs text-[var(--color-text-muted)]">참가비</p>}
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                {fee ?? <span className="text-sm text-[var(--color-text-muted)]">무료</span>}
              </span>
            </div>
            {isFullyBooked ? (
              <button
                className="bg-[var(--color-border)] text-[var(--color-text-muted)] font-bold py-1.5 px-4 rounded text-sm cursor-not-allowed"
                disabled
              >
                마감
              </button>
            ) : (
              <button className="bg-[var(--color-primary)] text-white font-bold py-1.5 px-4 rounded text-sm hover:bg-[var(--color-primary-hover)] transition-all">
                참여
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * GamesContent - 경기 목록 클라이언트 컴포넌트
 *
 * 기존 API 호출 로직(useEffect + fetch + AbortController) 100% 유지.
 * UI만 디자인 시안(bdr_1, bdr_5)에 맞게 전면 교체.
 */
export function GamesContent({
  GamesFilterComponent,
}: {
  GamesFilterComponent: React.ComponentType<{ cities: string[] }>;
}) {
  const searchParams = useSearchParams();

  const [games, setGames] = useState<GameFromApi[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 전역 선호 필터 Context (기존 유지)
  const { preferFilter } = usePreferFilter();

  // searchParams 또는 preferFilter가 바뀔 때마다 API 호출 (기존 로직 100% 유지)
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams(searchParams.toString());
    if (preferFilter) {
      params.set("prefer", "true");
    } else {
      params.delete("prefer");
    }
    const url = `/api/web/games?${params.toString()}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<GamesApiResponse>;
      })
      .then((data) => {
        if (data) {
          setGames(data.games ?? []);
          setCities(data.cities ?? []);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setGames([]);
        setCities([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchParams, preferFilter]);

  return (
    <>
      {/* 헤더 영역 - 1행 통합: 제목 + 검색/필터 + MY/NEW 버튼 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {/* 제목 (왼쪽 고정) */}
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] shrink-0" style={{ fontFamily: "var(--font-heading)" }}>
            경기 찾기
          </h1>

          {/* 가운데 여백 - 제목과 오른쪽 버튼들 사이를 벌림 */}
          <div className="flex-1" />

          {/* 검색 + 필터 + MY + NEW (오른쪽 정렬) */}
          <div className="flex items-center gap-2">
            {/* 검색/필터 컴포넌트 (축소된 검색창 + 필터 트리거) */}
            <GamesFilterComponent cities={cities} />

            {/* MY 버튼 */}
            <Link
              href="/games/my-games"
              prefetch={true}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-colors bg-[var(--color-accent)] text-[var(--color-text-primary)] shrink-0"
              title="내 경기"
            >
              MY
            </Link>

            {/* + 경기 만들기 버튼 */}
            <Link
              href="/games/new"
              prefetch={true}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors bg-[var(--color-primary)] shrink-0"
              title="경기 만들기"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* 로딩 중이면 스켈레톤 표시 */}
      {loading ? (
        <GamesGridSkeleton />
      ) : (
        <>
          {/* "Available Games" + 건수 배지 (항상 표시) */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
              참여 가능한 경기
              <span className="bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-xs px-2 py-1 rounded">
                {games.length} 진행중
              </span>
            </h2>
          </div>

          {/* 경기 카드 그리드 - 3열 레이아웃 (디자인 시안) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}

            {/* 빈 상태 */}
            {games.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-[var(--color-text-muted)] mb-3 block">
                  sports_basketball
                </span>
                <p className="text-[var(--color-text-secondary)]">
                  {(searchParams.get("q") || searchParams.get("type") || searchParams.get("city") || searchParams.get("date") || preferFilter)
                    ? "조건에 맞는 경기가 없습니다."
                    : "등록된 경기가 없습니다."
                  }
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
