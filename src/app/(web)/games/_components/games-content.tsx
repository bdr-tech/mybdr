"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// API에서 내려오는 경기 데이터 타입 (snake_case로 자동 변환됨)
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

// -- 경기 유형 뱃지 매핑 --
const TYPE_BADGE: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "PICKUP",   color: "#FFFFFF", bg: "#2563EB" },
  1: { label: "GUEST",    color: "#FFFFFF", bg: "#16A34A" },
  2: { label: "PRACTICE", color: "#FFFFFF", bg: "#D97706" },
};

// -- 경기 상태 라벨 매핑 --
const STATUS_LABEL: Record<number, { text: string; color: string }> = {
  1: { text: "모집중", color: "#16A34A" },
  2: { text: "확정",   color: "#2563EB" },
  3: { text: "완료",   color: "#6B7280" },
  4: { text: "취소",   color: "#EF4444" },
};

// -- 실력 뱃지 매핑 --
const SKILL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  beginner:               { label: "초급",   color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
  intermediate:           { label: "중급",   color: "#2563EB", bg: "rgba(37,99,235,0.10)" },
  intermediate_advanced:  { label: "중상",   color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  advanced:               { label: "상급",   color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
};

// -- 스켈레톤 UI (로딩 중 표시) --
function GamesGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[16px] bg-white border border-[#E8ECF0] overflow-hidden">
          <div className="h-1 bg-[#E8ECF0]" />
          <div className="p-3.5 space-y-2.5">
            <Skeleton className="h-4 w-14 rounded-[6px]" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// -- 경기 카드 (API 응답 타입에 맞춤) --
function GameCard({ game }: { game: GameFromApi }) {
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;
  const badge = TYPE_BADGE[game.game_type] ?? TYPE_BADGE[0];
  const status = STATUS_LABEL[game.status] ?? null;
  const skill = game.skill_level && game.skill_level !== "all" ? SKILL_BADGE[game.skill_level] : null;
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0;
  const barColor = pct >= 100 ? "#EF4444" : pct >= 80 ? "#D97706" : "#1B3C87";
  const location = game.venue_name ?? game.city ?? "";

  // Decimal 문자열 -> 숫자 변환 후 포맷
  const fee = game.fee_per_person && Number(game.fee_per_person) > 0
    ? `\u20A9${Number(game.fee_per_person).toLocaleString()}`
    : null;

  // ISO string -> 한국 날짜/시간 포맷
  const dateStr = game.scheduled_at
    ? `${new Date(game.scheduled_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", timeZone: "Asia/Seoul" })} ${new Date(game.scheduled_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}`
    : "";

  return (
    <Link href={href}>
      <div className="group flex h-full flex-col rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1B3C87]/30">
        {/* 상단 컬러 바 */}
        <div className="h-1" style={{ backgroundColor: badge.bg }} />

        <div className="flex flex-1 flex-col p-3.5">
          {/* Row 1: 유형 뱃지 + 상태 */}
          <div className="mb-2 flex items-center justify-between">
            <span
              className="rounded-[6px] px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            {status && (
              <span className="text-[11px] font-bold" style={{ color: status.color }}>
                {status.text}
              </span>
            )}
          </div>

          {/* Row 2: 제목 */}
          <h3 className="mb-1 text-sm font-bold text-[#111827] line-clamp-1 leading-tight group-hover:text-[#1B3C87] transition-colors">
            {game.title}
          </h3>

          {/* Row 3: 날짜 + 장소 */}
          <div className="mb-2 space-y-0.5">
            {dateStr && (
              <p className="flex items-center gap-1 text-xs text-[#6B7280]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {dateStr}
              </p>
            )}
            {location && (
              <p className="flex items-center gap-1 text-xs text-[#6B7280]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="line-clamp-1">{location}</span>
              </p>
            )}
          </div>

          {/* Row 4: 참가 프로그레스 */}
          {max > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8ECF0]">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: barColor }}>
                {cur}/{max}
              </span>
            </div>
          )}

          {/* Row 5: 참가비 + 난이도 */}
          <div className="mt-auto flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-[#111827]">
              {fee ?? <span className="text-[#9CA3AF]">무료</span>}
            </span>
            {skill && (
              <span
                className="rounded-[6px] px-2 py-0.5 text-xs font-bold"
                style={{ backgroundColor: skill.bg, color: skill.color }}
              >
                {skill.label}
              </span>
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
 * URL의 searchParams가 바뀔 때마다 /api/web/games를 호출하여
 * 경기 목록과 도시 목록을 가져온다.
 * GamesFilter에 도시 목록을 전달하고, 경기 카드를 렌더링한다.
 */
export function GamesContent({
  GamesFilterComponent,
}: {
  // GamesFilter 컴포넌트를 외부에서 주입받음 (cities 데이터를 동적으로 전달하기 위해)
  GamesFilterComponent: React.ComponentType<{ cities: string[] }>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [games, setGames] = useState<GameFromApi[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // "내 선호 지역만 보기" 토글 상태 — URL의 prefer 파라미터와 동기화
  const preferOn = searchParams.get("prefer") === "true";

  // 토글 클릭 시 URL에 prefer 파라미터를 추가/제거
  const handlePreferToggle = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (preferOn) {
      params.delete("prefer"); // OFF로 전환 — prefer 파라미터 제거
    } else {
      params.set("prefer", "true"); // ON으로 전환
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [preferOn, searchParams, router, pathname]);

  // searchParams가 바뀔 때마다 API 호출
  useEffect(() => {
    setLoading(true);

    // 현재 URL의 쿼리 파라미터를 그대로 API에 전달
    const params = new URLSearchParams(searchParams.toString());
    const url = `/api/web/games?${params.toString()}`;

    fetch(url)
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
      .catch(() => {
        setGames([]);
        setCities([]);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  // 필터가 활성화되어 있는지 확인
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const city = searchParams.get("city");
  const date = searchParams.get("date");
  const hasFilters = q || (type && type !== "all") || (city && city !== "all") || (date && date !== "all") || preferOn;

  return (
    <>
      {/* 헤더 영역 */}
      <div className="mb-5 flex items-center justify-between">
        <h1
          className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          GAMES
        </h1>
        <div className="flex items-center gap-2">
          {/* 내 선호 지역만 보기 토글 버튼 */}
          <button
            onClick={handlePreferToggle}
            className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
              preferOn
                ? "bg-[#1B3C87] text-white"           // ON: 강조 색상
                : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]" // OFF: 회색
            }`}
            title="내 선호 지역만 보기"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {preferOn ? "선호 ON" : "선호"}
          </button>
          <Link
            href="/games/my-games"
            prefetch={true}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF9F43] text-xs font-black text-[#111827] hover:bg-[#F7931E] transition-colors"
            title="내 경기"
          >
            MY
          </Link>
          <Link
            href="/games/new"
            prefetch={true}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B3C87] text-white hover:bg-[#142D6B] transition-colors"
            title="경기 만들기"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
          {/* 도시 목록은 API 응답에서 가져오므로 로딩 전에는 빈 배열 전달 */}
          <GamesFilterComponent cities={cities} />
        </div>
      </div>

      {/* 로딩 중이면 스켈레톤 표시 */}
      {loading ? (
        <GamesGridSkeleton />
      ) : (
        <>
          {/* 필터 활성 시 결과 카운트 */}
          {hasFilters && (
            <p className="mb-4 text-sm text-[#9CA3AF]">
              검색 결과 <span className="text-[#111827]">{games.length}개</span>
            </p>
          )}

          {/* 경기 카드 그리드 */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}

            {/* 빈 상태 */}
            {games.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="mb-3 text-4xl">&#127936;</div>
                <p className="text-[#6B7280]">
                  {hasFilters ? "조건에 맞는 경기가 없습니다." : "등록된 경기가 없습니다."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
