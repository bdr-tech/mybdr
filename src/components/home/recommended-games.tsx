"use client";

/* ============================================================
 * RecommendedGames -- 추천/인기 경기 섹션
 *
 * /api/web/recommended-games API 응답을 기반으로 동적 렌더링한다.
 * API 실패 시 하드코딩 fallback 카드를 보여준다.
 *
 * 구조:
 * - 빨간 세로 막대 + 제목 + "전체보기" 링크
 * - 경기 카드: 유형별 아이콘/그라디언트 + 뱃지 + 제목 + 일시/장소 + "예약하기" 버튼
 * ============================================================ */

import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";

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

/* ---- 경기 유형별 뱃지/그라디언트 매핑 ---- */
/* game_type: 0=PICKUP, 1=GUEST, 2=PRACTICE (DB Int -> API에서 문자열로 변환) */
const GAME_TYPE_CONFIG: Record<string, {
  label: string;
  icon: string;         // Material Symbols 아이콘명
  gradient: string;     // 이미지 대신 보여줄 배경 그라디언트
}> = {
  "0": { label: "PICKUP",   icon: "sports_basketball", gradient: "linear-gradient(135deg, var(--color-primary), #1e40af)" },
  "1": { label: "GUEST",    icon: "group_add",         gradient: "linear-gradient(135deg, #16a34a, #065f46)" },
  "2": { label: "PRACTICE", icon: "fitness_center",    gradient: "linear-gradient(135deg, #d97706, #92400e)" },
};

/* 기본값: 알 수 없는 타입일 때 */
const DEFAULT_TYPE_CONFIG = {
  label: "GAME",
  icon: "sports_basketball",
  gradient: "linear-gradient(135deg, var(--color-primary), #1e40af)",
};

/* ---- 날짜/시간 포맷 헬퍼 ---- */
/* ISO 문자열을 "MM.DD" 형태로 변환 */
function formatDate(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/* ISO 문자열을 "HH:MM" 형태로 변환 */
function formatTime(iso: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
  // SWR이 백그라운드에서 API를 다시 호출하여 최신 데이터로 갱신
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

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
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
      <div className="flex flex-row overflow-x-auto gap-6 no-scrollbar -mx-6 px-6 md:grid md:grid-cols-2 md:overflow-visible md:mx-0 md:px-0">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}

/* ---- 개별 경기 카드 컴포넌트 ---- */
/* 경기 유형에 따라 뱃지 색상/아이콘/그라디언트를 자동 적용한다 */
function GameCard({ game }: { game: RecommendedGame }) {
  const typeConfig = GAME_TYPE_CONFIG[game.game_type ?? "0"] ?? DEFAULT_TYPE_CONFIG;

  /* 경기 상세 링크: uuid가 있으면 앞 8자리 사용, 없으면 id */
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;

  /* 장소 텍스트: venue_name > city > 빈 문자열 */
  const location = game.venue_name ?? game.city ?? "";

  /* 남은 자리 텍스트 */
  const spotsText = game.spots_left !== null ? `${game.spots_left}자리 남음` : null;

  return (
    <Link
      href={href}
      className="min-w-[280px] md:min-w-0 bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group block"
    >
      {/* 이미지 영역: DB에 이미지가 없으므로 경기 유형별 그라디언트 + 아이콘 */}
      <div
        className="relative h-40 flex items-center justify-center"
        style={{ background: typeConfig.gradient }}
      >
        {/* 유형별 대형 아이콘 (배경 장식) */}
        <span
          className="material-symbols-outlined text-white/20 select-none"
          style={{ fontSize: "80px" }}
        >
          {typeConfig.icon}
        </span>

        {/* 유형 뱃지 (좌상단) */}
        <div className="absolute top-3 left-3 bg-primary text-on-primary text-xs font-bold px-2 py-1 rounded">
          {typeConfig.label}
        </div>

        {/* 추천 이유 뱃지 (우상단) - match_reason이 있을 때만 표시 */}
        {game.match_reason.length > 0 && (
          <div className="absolute top-3 right-3 bg-surface/90 text-primary text-xs font-bold px-2 py-1 rounded">
            {game.match_reason[0]}
          </div>
        )}
      </div>

      {/* 카드 본문 */}
      <div className="p-5">
        {/* 경기 제목 */}
        <h4 className="text-lg font-bold text-text-primary mb-2 line-clamp-1">
          {game.title ?? "경기"}
        </h4>

        {/* 일시 + 장소 정보 */}
        <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
          {/* 날짜 */}
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">calendar_today</span>
            {formatDate(game.scheduled_at)}
          </span>
          {/* 시간 */}
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">schedule</span>
            {formatTime(game.scheduled_at)}
          </span>
          {/* 장소 (있을 때만) */}
          {location && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">location_on</span>
              <span className="truncate max-w-[100px]">{location}</span>
            </span>
          )}
        </div>

        {/* 남은 자리 표시 (있을 때만) */}
        {spotsText && (
          <p className="text-xs text-primary font-bold mb-3">{spotsText}</p>
        )}

        {/* 예약하기 버튼 */}
        <span className="block w-full py-2.5 bg-primary text-on-primary text-sm font-bold rounded hover:brightness-110 transition-all active:scale-95 text-center">
          예약하기
        </span>
      </div>
    </Link>
  );
}
