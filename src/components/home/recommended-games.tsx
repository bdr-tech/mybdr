"use client";

/* ============================================================
 * RecommendedGames -- 추천/인기 경기 섹션
 *
 * /api/web/recommended-games API 응답을 기반으로 동적 렌더링한다.
 * API 실패 시 하드코딩 fallback 카드를 보여준다.
 *
 * 2026-03-27: games-content.tsx GameCard와 동일한 컴팩트 스타일 적용
 * - h-20 lg:h-28 이미지 영역 + Google Places 사진
 * - TYPE_BADGE 공통 상수 사용
 * - 우하단 장소/시간 뱃지 (bg-black/50 backdrop-blur)
 * - p-3 정보 영역 (제목+잔여석 / 참여 버튼)
 * ============================================================ */

import { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDateTime } from "@/lib/utils/format-date";
// 경기 카드와 동일한 뱃지 상수 import
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

/* 세션 정보: 서버에서 getWebSession()으로 받은 JwtPayload를 전달받는다 */
interface UserSession {
  sub: string;
  name: string;
  email: string;
  role: string;
}

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
  session: UserSession | null;
  /* 서버에서 미리 가져온 데이터 (있으면 로딩 없이 즉시 표시, 없으면 기존처럼 SWR이 API 호출) */
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

export function RecommendedGames({ session, fallbackData }: RecommendedGamesProps) {
  // useSWR로 추천 경기 API 호출
  // fallbackData가 있으면 초기값으로 사용 → 로딩 스켈레톤 없이 즉시 렌더링
  const { data, isLoading: loading } = useSWR<RecommendedData>(
    "/api/web/recommended-games",
    null,
    { fallbackData }
  );

  /* 로그인 시 "~님을 위한 추천", 비로그인 시 "인기 경기 및 토너먼트" */
  const userName = data?.user_name ?? session?.name;
  const title = session
    ? `"${userName ?? "Player"}"님을 위한 추천`
    : "인기 경기 및 토너먼트";

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
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-16" />
        </div>
        {/* 스켈레톤도 컴팩트 카드 크기에 맞춤 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* 섹션 헤더: 빨간 세로 막대 + 제목 + 전체보기 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-3">
          <span className="w-1.5 h-6 bg-primary" />
          {title}
        </h3>
        <Link
          href="/games"
          className="text-sm text-text-muted hover:text-primary transition-colors"
        >
          전체보기
        </Link>
      </div>

      {/* 반응형 레이아웃: 모바일 가로 스크롤 / 데스크탑 2열 그리드 */}
      <div className="flex flex-row overflow-x-auto gap-4 no-scrollbar -mx-6 px-6 md:grid md:grid-cols-2 md:overflow-visible md:mx-0 md:px-0">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            // photoMap undefined = 로딩 중 -> shimmer, 있으면 URL 또는 null
            photoUrl={photoMap === undefined ? undefined : (photoMap[game.venue_name ?? game.city ?? ""] ?? null)}
          />
        ))}
      </div>
    </section>
  );
}

/* ---- 개별 경기 카드 컴포넌트 (games-content.tsx GameCard와 동일 구조) ---- */
// photoUrl: undefined = 로딩 중 (shimmer), null = 사진 없음 (그라디언트+아이콘), string = 사진 있음
function GameCard({ game, photoUrl }: { game: RecommendedGame; photoUrl?: string | null }) {
  // game_type은 문자열("0","1","2")로 오므로 숫자로 변환
  const typeNum = Number(game.game_type ?? "0");
  const badge = TYPE_BADGE[typeNum] ?? TYPE_BADGE[0];

  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;
  const location = game.venue_name ?? game.city ?? "";

  // ISO string -> 간결한 상대 시간 ("오늘 19:00" / "내일 14:00" / "3/22 19:00")
  const scheduleStr = formatRelativeDateTime(game.scheduled_at);

  // 남은 자리 텍스트
  const spotsText = game.spots_left !== null ? `${game.spots_left}자리` : null;

  return (
    <Link href={href} className="min-w-[240px] md:min-w-0 block">
      <div className="group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] hover:shadow-lg transition-all h-full">
        {/* 이미지 영역: Google Places 사진 -> 유형별 그라디언트+아이콘 fallback */}
        {/* undefined: 로딩 중 (shimmer) / null: 사진 없음 / string: 사진 있음 */}
        <div
          className={`relative h-20 lg:h-28 flex items-center justify-center bg-cover bg-center ${photoUrl === undefined ? "animate-pulse" : ""}`}
          style={photoUrl
            ? { backgroundImage: `url(${photoUrl})` }
            : { background: badge.gradient }
          }
        >
          {/* 사진이 없고 로딩도 아닐 때: 유형별 아이콘 */}
          {photoUrl === null && (
            <span className="material-symbols-outlined text-5xl text-white/20">{badge.icon}</span>
          )}

          {/* 유형 뱃지 (좌상단) */}
          <span
            className="absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-bold uppercase"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>

          {/* 추천 이유 뱃지 (우상단) - match_reason이 있을 때만 */}
          {game.match_reason.length > 0 && (
            <span className="absolute top-2 right-2 rounded bg-white/90 px-1.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
              {game.match_reason[0]}
            </span>
          )}

          {/* 위치 + 시간 뱃지 (우하단) -- bg-black/50 backdrop-blur */}
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

        {/* 정보 영역: 제목+잔여석 / 참여 버튼 (p-3 컴팩트) */}
        <div className="p-3">
          {/* 제목 + 잔여석 */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="text-sm font-bold line-clamp-1 text-[var(--color-text-primary)] flex-1">
              {game.title ?? "경기"}
            </h4>
            {spotsText && (
              <span className="shrink-0 text-xs font-bold text-[var(--color-primary)]">{spotsText}</span>
            )}
          </div>

          {/* 참여 버튼 */}
          <div className="flex items-center justify-end">
            <span className="text-xs font-bold text-white bg-[var(--color-primary)] px-3 py-1 rounded">참여</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
