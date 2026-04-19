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
// [2026-04-18 추가] 카페 크롤링 텍스트의 HTML 엔티티(&amp; &#39; &nbsp; 등)를
// 렌더링 시점에만 디코드. DB 원본은 그대로 유지.
import { decodeHtmlEntities } from "@/lib/utils/decode-html";
import { TYPE_BADGE, SKILL_BADGE } from "../_constants/game-badges";
// [2026-04-19 추가] 상단 경기 유형 탭 — ?type URL 쿼리 기반, loading 분기 밖에 배치
import { GameTypeTabs } from "./game-type-tabs";

// batch API fetcher
// [2026-04-17 변경] 5초 타임아웃 추가 — Google Places Photo API가 늦거나 실패해도
// 카드가 무한 펄스 상태로 남지 않도록. 타임아웃/에러 시 빈 객체({})를 반환해
// useSWR이 에러 상태로 빠지지 않게 한다 (data는 {}로 채워지고 photoMap[venue]는 undefined → null 폴백).
const PHOTO_FETCH_TIMEOUT_MS = 5000;
const batchPhotoFetcher = async (key: string): Promise<Record<string, string | null>> => {
  const queries = JSON.parse(key.replace("/api/web/place-photos:", ""));
  // AbortController + setTimeout 패턴: 5초 후 fetch 강제 중단
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PHOTO_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch("/api/web/place-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
      signal: controller.signal,
    });
    const data = await res.json();
    return (data.results ?? {}) as Record<string, string | null>;
  } catch {
    // 타임아웃 또는 네트워크 에러 — 빈 객체 반환 (각 venue가 undefined → null 폴백 처리)
    return {};
  } finally {
    clearTimeout(timeoutId);
  }
};

// API 타입 (snake_case — apiSuccess()의 convertKeysToSnakeCase 변환 결과와 일치)
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
  author_nickname: string | null;
}

// [2026-04-19 추가] 유형별 건수 — apiSuccess 가 camelCase(typeCounts) → snake_case(type_counts)로 변환
interface TypeCounts {
  "0": number; // PICKUP
  "1": number; // GUEST
  "2": number; // PRACTICE
  all: number;
}

interface GamesApiResponse {
  games: GameFromApi[];
  cities: string[];
  type_counts?: TypeCounts;
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
  // [2026-04-18] 장소 표시 디코드 — venue_name에 &amp; 등이 섞여 들어오는 케이스 방지
  const location = decodeHtmlEntities(game.venue_name ?? game.city ?? "");
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
        {/* 좌: 이미지/아이콘 영역 (정사각형 80px, 둥근 모서리)
            [2026-04-17 변경] photoUrl 3가지 분기 명확화:
              - string: 사진 표시
              - null: 게임 타입 아이콘 폴백 (큰 아이콘 + gradient 배경) — 사진 없음 or 5초 타임아웃
              - undefined: 로딩 중 펄스 (5초 이내) */}
        <div
          className={`relative w-20 h-20 shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-cover bg-center ${photoUrl === undefined ? "animate-pulse bg-[var(--color-surface)]" : ""}`}
          style={photoUrl
            ? { backgroundImage: `url(${photoUrl})` }
            : photoUrl === null ? { background: badge.gradient } : undefined
          }
        >
          {/* 사진 없을 때 폴백: 큰 게임 타입 아이콘 (PRACTICE=fitness_center, PICKUP=sports_basketball, GUEST=group_add)
              text-5xl로 키워서 80px 영역 안에서 카드 종류를 한눈에 식별 가능하게.
              white/85로 gradient 배경 위에서 충분한 대비 확보. */}
          {photoUrl === null && (
            <span className="material-symbols-outlined text-5xl text-white/85" style={{ fontSize: "3rem" }}>
              {badge.icon}
            </span>
          )}
          {/* 유형 뱃지 (좌상단 작게) — 큰 아이콘과 중복이지만, 정확한 타입 텍스트 표시용으로 유지 */}
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
                {/* [2026-04-18] 제목 디코드 — 카페 원문의 엔티티 표시 방지 */}
                {decodeHtmlEntities(game.title)}
              </h3>
              {statusBadge && (
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold ${statusBadge.className}`}>
                  {statusBadge.text}
                </span>
              )}
            </div>
            {/* 작성자 + 장소 + 시간 */}
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              {game.author_nickname && (
                <span className="flex items-center gap-0.5 truncate">
                  <span className="material-symbols-outlined text-xs">person</span>
                  {/* [2026-04-18] 작성자 닉네임 디코드 — 카페 닉에 간혹 엔티티 포함 */}
                  {decodeHtmlEntities(game.author_nickname)}
                </span>
              )}
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
  // [2026-04-19 추가] 유형별 건수 — 로딩 중에는 undefined 로 내려 탭 숫자 숨김
  const [typeCounts, setTypeCounts] = useState<TypeCounts | undefined>(undefined);
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
          // type_counts 가 API 응답에 포함되어 있을 때만 덮어쓰기 (없으면 탭은 숫자 숨김)
          setTypeCounts(data.type_counts);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setGames([]);
        setCities([]);
        setTypeCounts(undefined);
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

  // [2026-04-17 변경] errorRetryCount: 1 추가 — Photo API 실패 시 재시도 1회로 제한
  // (fetcher는 이미 catch에서 {} 반환하므로 사실상 추가 보호막. revalidateOnFocus/dedupingInterval은 기존 유지)
  const { data: photoMap } = useSWR(
    venueQueries.length > 0
      ? `/api/web/place-photos:${JSON.stringify(venueQueries)}`
      : null,
    batchPhotoFetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600000, errorRetryCount: 1 }
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
              // text-white 제거 + style의 color를 --color-on-accent로: 다크모드에서 accent 배경이 밝아져도 글씨 자동 대비 유지
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-colors bg-[var(--color-accent)] shrink-0"
              style={{ color: "var(--color-on-accent)" }}
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

      {/* 경기 유형 탭 — 로딩 중에도 노출되어야 사용자가 즉시 전환 가능하므로
          loading 분기 바깥에 배치. ?type URL 쿼리만 조작 → API 재호출은 searchParams
          변경 감지하는 기존 useEffect가 자동 처리.
          loading 중엔 counts=undefined 로 내려 숫자만 숨기고 탭은 노출 유지. */}
      <GameTypeTabs counts={loading ? undefined : typeCounts} />

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
