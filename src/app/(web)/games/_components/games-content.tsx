"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
import { formatRelativeDateTime } from "@/lib/utils/format-date";

// batch API fetcher: 장소명 배열을 한번에 보내고 { results: { 장소명: url } } 형태로 받음
const batchPhotoFetcher = (key: string) => {
  // key에서 장소명 배열을 추출 (JSON.stringify된 배열이 key에 포함됨)
  const queries = JSON.parse(key.replace("/api/web/place-photos:", ""));
  return fetch("/api/web/place-photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queries }),
  })
    .then((res) => res.json())
    .then((data) => (data.results ?? {}) as Record<string, string | null>);
};

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
// photoUrl을 부모에서 batch로 가져와서 prop으로 전달 (개별 API 호출 제거)
// photoUrl: undefined = 로딩 중 (shimmer), null = 사진 없음 (그라디언트+아이콘), string = 사진 있음
function GameCard({ game, photoUrl }: { game: GameFromApi; photoUrl?: string | null }) {
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

  // ISO string -> 간결한 상대 시간 포맷 ("오늘 19:00" / "내일 14:00" / "3/22 19:00")
  const scheduleStr = formatRelativeDateTime(game.scheduled_at);

  return (
    <Link href={href}>
      <div className={`group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] hover:shadow-lg transition-all h-full ${isFullyBooked ? "opacity-70 grayscale" : ""}`}>
        {/* 이미지 영역: 장소 사진 -> 유형별 그라디언트+아이콘 fallback */}
        {/* photoUrl === undefined: 로딩 중 (animate-pulse shimmer) */}
        {/* photoUrl === null: 사진 없음 (그라디언트 + 아이콘) */}
        {/* photoUrl === string: 사진 표시 */}
        <div
          className={`relative h-20 lg:h-28 flex items-center justify-center bg-cover bg-center ${photoUrl === undefined ? "animate-pulse" : ""}`}
          style={photoUrl
            ? { backgroundImage: `url(${photoUrl})` }
            : { background: badge.gradient }
          }
        >
          {/* 사진이 없고 로딩도 아닐 때: 유형별 아이콘 (반투명) */}
          {photoUrl === null && (
            <span className="material-symbols-outlined text-5xl text-white/20">{badge.icon}</span>
          )}

          {/* FULLY BOOKED 오버레이 */}
          {isFullyBooked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-black font-black text-xs px-3 py-1 rounded">만석</span>
            </div>
          )}

          {/* 유형 뱃지 (좌상단) */}
          <span
            className="absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-bold uppercase"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>

          {/* 위치 + 시간 뱃지 (우하단) */}
          <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
            {location && (
              <span className="flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">
                <span className="material-symbols-outlined text-xs">location_on</span>
                <span className="line-clamp-1 max-w-[140px]">{location}</span>
              </span>
            )}
            {scheduleStr && (
              <span className="flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">
                <span className="material-symbols-outlined text-xs">schedule</span>
                {scheduleStr}
              </span>
            )}
          </div>
        </div>

        {/* 정보 영역: 제목 + 참가/참여를 한 줄에 */}
        <div className="p-3">
          {/* 제목 + 모집 현황 */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-bold line-clamp-1 text-[var(--color-text-primary)] flex-1">{game.title}</h3>
            {max > 0 && (
              <span className="shrink-0 text-xs font-bold text-[var(--color-primary)]">{cur}/{max}</span>
            )}
          </div>

          {/* 참가비 + 참여 버튼 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">
              {fee ?? <span className="text-xs text-[var(--color-text-muted)]">무료</span>}
            </span>
            {isFullyBooked ? (
              <span className="text-xs font-bold text-[var(--color-text-muted)] bg-[var(--color-border)] px-3 py-1 rounded">마감</span>
            ) : (
              <span className="text-xs font-bold text-white bg-[var(--color-primary)] px-3 py-1 rounded">참여</span>
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

  // 모든 경기의 장소명을 수집하여 batch API 1번 호출 (60번 → 1번으로 줄임)
  const venueQueries = useMemo(() => {
    return games
      .map((g) => g.venue_name ?? g.city ?? "")
      .filter((v) => v.length >= 2);
  }, [games]);

  // batch API: 장소명 배열을 key에 포함 (배열이 바뀌면 재호출)
  const { data: photoMap } = useSWR(
    venueQueries.length > 0
      ? `/api/web/place-photos:${JSON.stringify(venueQueries)}`
      : null,
    batchPhotoFetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600000 }
  );

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
              <GameCard
                key={g.id}
                game={g}
                // photoMap 자체가 undefined면 로딩 중 -> photoUrl도 undefined (shimmer 표시)
                // photoMap이 있으면 해당 장소의 URL 또는 null (사진 없음)
                photoUrl={photoMap === undefined ? undefined : (photoMap[g.venue_name ?? g.city ?? ""] ?? null)}
              />
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
