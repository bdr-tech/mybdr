"use client";

/* ============================================================
 * GamesContent — 경기 목록 (토스 스타일)
 *
 * 토스 스타일 변경:
 * - 3열 그리드 → TossCard 스타일 카드 (둥근 모서리, 가벼운 그림자)
 * - 검색/필터 헤더 유지
 * - 경기 유형 아이콘(원형 배경) + 제목/장소 + 시간/참가비
 *
 * API/데이터 패칭 로직은 기존과 100% 동일하게 유지.
 * ============================================================ */

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
import { formatRelativeDateTime } from "@/lib/utils/format-date";
import { TYPE_BADGE, SKILL_BADGE } from "../_constants/game-badges";

// batch API fetcher (기존과 동일)
const batchPhotoFetcher = (key: string) => {
  const queries = JSON.parse(key.replace("/api/web/place-photos:", ""));
  return fetch("/api/web/place-photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queries }),
  })
    .then((res) => res.json())
    .then((data) => (data.results ?? {}) as Record<string, string | null>);
};

// API 타입 (기존과 동일)
interface GameFromApi {
  id: string;
  uuid: string | null;
  title: string | null;
  status: number;
  game_type: number;
  city: string | null;
  venue_name: string | null;
  scheduled_at: string | null;
  current_participants: number | null;
  max_participants: number | null;
  fee_per_person: string | null;
  skill_level: string | null;
}

interface GamesApiResponse {
  games: GameFromApi[];
  cities: string[];
}

/* 상태 배지 계산 (기존과 동일) */
function getStatusBadge(game: GameFromApi): { text: string; className: string } | null {
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const pct = max > 0 ? (cur / max) * 100 : 0;

  if (game.status === 3) {
    return { text: "라이브", className: "bg-[var(--color-primary)] text-white" };
  }
  if (pct >= 100) {
    return { text: "만석", className: "bg-[var(--color-text-disabled)] text-white" };
  }
  if (game.status === 1 && game.scheduled_at) {
    const hoursUntilStart = (new Date(game.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilStart > 0 && hoursUntilStart <= 24) {
      return { text: "곧 시작", className: "bg-black text-white" };
    }
  }
  return null;
}

/* 스켈레톤: 토스 스타일 카드 */
function GamesGridSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-md" />
      ))}
    </div>
  );
}

/* ---- 경기 카드: 토스 스타일 (둥근 모서리, 가벼운 그림자, 리스트형) ---- */
function GameCard({ game, photoUrl }: { game: GameFromApi; photoUrl?: string | null }) {
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;
  const badge = TYPE_BADGE[game.game_type] ?? TYPE_BADGE[0];
  const skill = game.skill_level && game.skill_level !== "all" ? SKILL_BADGE[game.skill_level] : null;
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0;
  const location = game.venue_name ?? game.city ?? "";
  const statusBadge = getStatusBadge(game);
  const isFullyBooked = statusBadge?.text === "만석";
  const fee = game.fee_per_person && Number(game.fee_per_person) > 0
    ? `${Number(game.fee_per_person).toLocaleString()}원`
    : "무료";
  const scheduleStr = formatRelativeDateTime(game.scheduled_at);

  return (
    <Link href={href}>
      {/* 토스 카드: 둥근 모서리(16px) + 가벼운 그림자 + 가로 배치 */}
      <div
        className={`group flex gap-3.5 rounded-md p-3.5 bg-[var(--color-card)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[var(--shadow-elevated)] ${isFullyBooked ? "opacity-60" : ""}`}
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* 좌: 이미지/아이콘 영역 (정사각형 80px, 둥근 모서리) */}
        <div
          className={`relative w-20 h-20 shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-cover bg-center ${photoUrl === undefined ? "animate-pulse bg-[var(--color-surface)]" : ""}`}
          style={photoUrl
            ? { backgroundImage: `url(${photoUrl})` }
            : photoUrl === null ? { background: badge.gradient } : undefined
          }
        >
          {/* 사진 없을 때 아이콘 */}
          {photoUrl === null && (
            <span className="material-symbols-outlined text-3xl text-white/30">{badge.icon}</span>
          )}
          {/* 유형 뱃지 (좌상단 작게) */}
          <span
            className="absolute top-1 left-1 rounded px-1 py-0.5 text-xs font-bold"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>

        {/* 우: 정보 영역 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {/* 상단: 제목 + 상태 뱃지 */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1 flex-1">
                {game.title}
              </h3>
              {statusBadge && (
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold ${statusBadge.className}`}>
                  {statusBadge.text}
                </span>
              )}
            </div>
            {/* 장소 + 시간 */}
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              {location && (
                <span className="flex items-center gap-0.5 truncate">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {location}
                </span>
              )}
              {scheduleStr && (
                <span className="flex items-center gap-0.5 shrink-0">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  {scheduleStr}
                </span>
              )}
            </div>
          </div>

          {/* 하단: 참가비 + 인원 + 참여 버튼 */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[var(--color-text-primary)]">{fee}</span>
              {max > 0 && (
                <span className="text-[var(--color-text-muted)]">{cur}/{max}명</span>
              )}
            </div>
            {isFullyBooked ? (
              <span className="text-xs font-bold text-[var(--color-text-disabled)] bg-[var(--color-surface)] px-3 py-1 rounded-lg">마감</span>
            ) : (
              <span className="text-xs font-bold text-white bg-[var(--color-primary)] px-3 py-1 rounded-lg">참여</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * GamesContent - 경기 목록 클라이언트 컴포넌트 (토스 스타일)
 * API 호출 로직 100% 유지. UI만 토스 스타일로 교체.
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
  const { preferFilter } = usePreferFilter();

  // API 호출 (기존 로직 100% 유지)
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

  // batch 사진 API (기존과 동일)
  const venueQueries = useMemo(() => {
    return games
      .map((g) => g.venue_name ?? g.city ?? "")
      .filter((v) => v.length >= 2);
  }, [games]);

  const { data: photoMap } = useSWR(
    venueQueries.length > 0
      ? `/api/web/place-photos:${JSON.stringify(venueQueries)}`
      : null,
    batchPhotoFetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600000 }
  );

  return (
    <>
      {/* 헤더 영역: 제목 + 검색/필터 + MY/NEW 버튼 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] shrink-0">
            경기 찾기
          </h1>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <GamesFilterComponent cities={cities} />
            <Link
              href="/games/my-games"
              prefetch={true}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-colors bg-[var(--color-accent)] text-white shrink-0"
              title="내 경기"
            >
              MY
            </Link>
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

      {/* 로딩 중이면 스켈레톤 */}
      {loading ? (
        <GamesGridSkeleton />
      ) : (
        <>
          {/* 건수 표시 */}
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              참여 가능한 경기
            </h2>
            <span className="bg-[var(--color-primary-weak)] text-[var(--color-primary)] text-xs font-bold px-2 py-0.5 rounded-md">
              {games.length}
            </span>
          </div>

          {/* 경기 카드 리스트: 토스 스타일 세로 스택 */}
          <div className="space-y-6">
            {games.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                photoUrl={photoMap === undefined ? undefined : (photoMap[g.venue_name ?? g.city ?? ""] ?? null)}
              />
            ))}

            {/* 빈 상태 + CTA */}
            {games.length === 0 && (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-[var(--color-text-disabled)] mb-3 block">
                  sports_basketball
                </span>
                <p className="text-[var(--color-text-muted)] text-sm mb-4">
                  {(searchParams.get("q") || searchParams.get("type") || searchParams.get("city") || searchParams.get("date") || preferFilter)
                    ? "조건에 맞는 경기가 없습니다."
                    : "등록된 경기가 없습니다."
                  }
                </p>
                {/* 빈 상태 액션 버튼: 경기 만들기 */}
                <Link
                  href="/games/new"
                  className="inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.97]"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  경기 만들기
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
