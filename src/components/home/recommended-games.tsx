"use client";

/* ============================================================
 * RecommendedGames -- 추천/인기 경기 섹션 (토스 스타일)
 *
 * /api/web/recommended-games API 응답을 기반으로 동적 렌더링한다.
 * API 실패 시 하드코딩 fallback 카드를 보여준다.
 *
 * 토스 스타일 변경:
 * - TossSectionHeader로 "추천 경기" + "전체보기 >" 헤더
 * - TossCard로 둥근 모서리, 가벼운 그림자 카드
 * - 가로 스크롤 캐러셀 유지하되 카드 스타일만 변경
 *
 * API/데이터 패칭 로직은 기존과 100% 동일하게 유지.
 * ============================================================ */

import { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
import { formatRelativeDateTime } from "@/lib/utils/format-date";
import { TYPE_BADGE } from "@/app/(web)/games/_constants/game-badges";

// batch API fetcher: 장소명 배열을 한번에 보내고 맵으로 받음
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

/* API 응답의 각 경기 항목 (apiSuccess가 snake_case로 변환) */
interface RecommendedGame {
  id: string;
  uuid: string | null;
  title: string | null;
  scheduled_at: string | null;
  venue_name: string | null;
  city: string | null;
  game_type: string | null;
  spots_left: number | null;
  match_reason: string[];
}

/* API 전체 응답 구조 */
interface RecommendedData {
  user_name: string | null;
  games: RecommendedGame[];
}

interface RecommendedGamesProps {
  fallbackData?: RecommendedData;
}

/* ---- API 실패 시 보여줄 fallback 더미 데이터 ---- */
const FALLBACK_GAMES: RecommendedGame[] = [
  {
    id: "fallback-1", uuid: null,
    title: "토요일 밤 5vs5 풀코트 매치",
    scheduled_at: null, venue_name: null, city: null,
    game_type: "0", spots_left: null, match_reason: [],
  },
  {
    id: "fallback-2", uuid: null,
    title: "서초 일요 조기 농구 5:5",
    scheduled_at: null, venue_name: null, city: null,
    game_type: "0", spots_left: null, match_reason: [],
  },
  {
    id: "fallback-3", uuid: null,
    title: "게스트 매치 - 강남 체육관",
    scheduled_at: null, venue_name: null, city: null,
    game_type: "1", spots_left: null, match_reason: [],
  },
  {
    id: "fallback-4", uuid: null,
    title: "팀 연습 경기",
    scheduled_at: null, venue_name: null, city: null,
    game_type: "2", spots_left: null, match_reason: [],
  },
];

export function RecommendedGames({ fallbackData }: RecommendedGamesProps) {
  // useSWR로 추천 경기 API 호출 (기존 로직 100% 유지)
  const { data, isLoading: loading } = useSWR<RecommendedData>(
    "/api/web/recommended-games",
    null,
    { fallbackData, revalidateOnMount: true }
  );

  /* user_name이 있으면 로그인 → 개인화 제목, 없으면 비로그인 → 일반 제목 */
  const userName = data?.user_name;
  const title = userName
    ? `${userName}님을 위한 추천`
    : "추천 경기";

  /* API 응답이 없거나 games 배열이 비어있으면 fallback 사용 */
  const games = (data?.games && data.games.length > 0) ? data.games : FALLBACK_GAMES;

  // 모든 경기의 장소명을 수집하여 batch API 1번 호출
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

  if (loading) {
    return (
      <section>
        <Skeleton className="h-6 w-40 mb-4" />
        {/* 컴팩트 카드에 맞춰 스켈레톤도 낮은 높이로 */}
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[112px] w-[280px] rounded-md shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* 토스 스타일 섹션 헤더: 제목 + "전체보기 >" */}
      <TossSectionHeader title={title} actionHref="/games" />

      {/* 가로 스크롤 캐러셀: 토스 카드 스타일 */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            photoUrl={photoMap === undefined ? undefined : (photoMap[game.venue_name ?? game.city ?? ""] ?? null)}
          />
        ))}
      </div>
    </section>
  );
}

/* ---- 개별 경기 카드: 컴팩트 가로형 (썸네일 64x64 + 우측 정보) ---- */
function GameCard({ game, photoUrl }: { game: RecommendedGame; photoUrl?: string | null }) {
  const typeNum = Number(game.game_type ?? "0");
  const badge = TYPE_BADGE[typeNum] ?? TYPE_BADGE[0];
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;
  const location = game.venue_name ?? game.city ?? "";
  const scheduleStr = formatRelativeDateTime(game.scheduled_at);
  const spotsText = game.spots_left !== null ? `${game.spots_left}자리 남음` : null;

  return (
    <Link href={href} className="block shrink-0 w-[280px]">
      {/* 컴팩트 카드: 가로 배치, 네온 호버 효과 유지 */}
      <div
        className="group rounded-md overflow-hidden bg-[var(--color-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-primary border border-transparent hover:border-[var(--color-primary)] flex flex-row relative h-[112px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* 좌측 썸네일 영역 (64x64 고정) */}
        <div
          className={`relative w-16 h-[112px] shrink-0 flex items-center justify-center bg-cover bg-center ${photoUrl === undefined ? "animate-pulse bg-[var(--color-surface)]" : ""}`}
          style={photoUrl
            ? { backgroundImage: `url(${photoUrl})` }
            : photoUrl === null ? { background: badge.gradient } : undefined
          }
        >
          {/* 사진 없을 때 아이콘 */}
          {photoUrl === null && (
            <span className="material-symbols-outlined text-2xl text-white/40">{badge.icon}</span>
          )}
        </div>

        {/* 우측 정보 영역 */}
        <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-center gap-1">
          {/* 1행: 유형 뱃지 + 추천 이유 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-sm leading-none"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            {game.match_reason.length > 0 && (
              <span className="rounded-sm bg-white px-1.5 py-0.5 text-[9px] font-black text-[var(--color-primary)] leading-none">
                {game.match_reason[0]}
              </span>
            )}
          </div>

          {/* 2행: 제목 (1줄 말줄임) */}
          <h4 className="text-sm font-extrabold text-[var(--color-text-primary)] truncate leading-tight tracking-tight uppercase group-hover:text-[var(--color-primary)] transition-colors">
            {game.title ?? "GAME"}
          </h4>

          {/* 3행: 장소 + 시간 (한 줄로 · 구분) */}
          <p className="text-[11px] text-[var(--color-text-muted)] font-medium truncate flex items-center gap-1">
            {location && (
              <>
                <span className="material-symbols-outlined text-[12px]">location_on</span>
                <span className="truncate">{location}</span>
              </>
            )}
            {location && scheduleStr && <span className="opacity-40">·</span>}
            {scheduleStr && (
              <>
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                <span className="whitespace-nowrap">{scheduleStr}</span>
              </>
            )}
          </p>

          {/* 4행: 잔여석 (있을 때만) */}
          {spotsText && (
            <p className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase font-black tracking-wider text-[var(--color-text-muted)]">SPOT</span>
              <span className="text-[11px] font-black text-[var(--color-primary)]">
                {spotsText}
              </span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
