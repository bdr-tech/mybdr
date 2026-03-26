"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// API에서 내려오는 팀 데이터 타입 (apiSuccess가 snake_case로 자동 변환)
interface TeamFromApi {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  city: string | null;
  district: string | null;
  wins: number | null;
  losses: number | null;
  accepting_members: boolean | null;
  tournaments_count: number | null;
  member_count: number;
  created_at?: string | null;
}

interface TeamsApiResponse {
  teams: TeamFromApi[];
  cities: string[];
}

// -- 페이지당 팀 수 --
const TEAMS_PER_PAGE = 12;

// -- 배지 타입 정의 --
type BadgeType = "TOP1" | "인기" | "신규" | "플래티넘" | "프로" | "골드" | "루키" | null;

// -- 배지 계산: 승수 기반 디비전 + 특수 배지(TOP1/HOT/NEW) --
function computeBadges(teams: TeamFromApi[]): Map<string, BadgeType> {
  const badgeMap = new Map<string, BadgeType>();
  if (teams.length === 0) return badgeMap;

  // 승수 기준으로 정렬해서 TOP1 찾기
  const sorted = [...teams].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
  const topTeamId = sorted[0]?.id;
  const topWins = sorted[0]?.wins ?? 0;

  for (const team of teams) {
    const wins = team.wins ?? 0;
    const losses = team.losses ?? 0;
    const total = wins + losses;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    // 특수 배지 우선
    if (team.id === topTeamId && topWins > 0) {
      badgeMap.set(team.id, "TOP1");
      continue;
    }

    // 신규: created_at이 30일 이내
    if (team.created_at) {
      const created = new Date(team.created_at);
      const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 30) {
        badgeMap.set(team.id, "신규");
        continue;
      }
    }

    // 인기: 승률 70% 이상이고 5경기 이상
    if (winRate >= 70 && total >= 5) {
      badgeMap.set(team.id, "인기");
      continue;
    }

    // 디비전 배지: 승수 기준
    if (wins >= 30) {
      badgeMap.set(team.id, "플래티넘");
    } else if (wins >= 20) {
      badgeMap.set(team.id, "프로");
    } else if (wins >= 10) {
      badgeMap.set(team.id, "골드");
    } else {
      badgeMap.set(team.id, "루키");
    }
  }

  return badgeMap;
}

// -- 배지 색상 매핑 --
function getBadgeStyle(badge: BadgeType): { bg: string; text: string } {
  switch (badge) {
    case "TOP1":
      return { bg: "var(--color-primary)", text: "#FFFFFF" };
    case "인기":
      return { bg: "var(--color-accent)", text: "#FFFFFF" };
    case "신규":
      return { bg: "var(--color-success)", text: "#FFFFFF" };
    case "플래티넘":
      return { bg: "var(--color-accent)", text: "#FFFFFF" };
    case "프로":
      return { bg: "var(--color-primary)", text: "#FFFFFF" };
    case "골드":
      return { bg: "var(--color-tertiary)", text: "#FFFFFF" };
    case "루키":
      return { bg: "var(--color-text-disabled)", text: "#FFFFFF" };
    default:
      return { bg: "transparent", text: "transparent" };
  }
}

// -- 팀 액센트 색상 결정 (흰색이면 보조 색상 사용) --
function resolveAccent(primary: string | null, secondary?: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return secondary ?? "#E31B23";
  }
  return primary;
}

// -- 팀 색상 기반 그라디언트 생성 (notable-teams.tsx와 동일 패턴) --
function getTeamGradient(color: string | null): string {
  if (!color) return "linear-gradient(135deg, #374151 0%, #1f2937 100%)";
  return `linear-gradient(135deg, ${color}33 0%, ${color} 50%, ${color}cc 100%)`;
}

// -- 팀명에서 이니셜 추출 (한글: 첫 2글자, 영문: 각 단어 첫 글자) --
function getInitials(name: string): string {
  if (/^[가-힣]/.test(name)) return name.slice(0, 2);
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// -- 스켈레톤 UI: 컴팩트 카드 디자인 기준 --
function TeamsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          {/* 이미지 영역 스켈레톤 (h-20 lg:h-28) */}
          <Skeleton className="h-20 lg:h-28 w-full rounded-none" />
          {/* 정보 영역 스켈레톤 (p-3, 2행) */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// -- 컴팩트 팀 카드 (경기/대회 카드와 동일 패턴: h-20 이미지 + p-3 정보) --
function TeamCardRedesigned({
  team,
  badge,
}: {
  team: TeamFromApi;
  badge: BadgeType;
}) {
  const accent = resolveAccent(team.primary_color, team.secondary_color);
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const total = wins + losses;
  // 승률 계산: 0으로 나누기 방지
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const location = [team.city, team.district].filter(Boolean).join(" ");
  const badgeStyle = getBadgeStyle(badge);

  return (
    <Link href={`/teams/${team.id}`}>
      <div className="group rounded-lg border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg h-full border-[var(--color-border)] bg-[var(--color-surface)]">
        {/* 이미지 영역: 팀 색상 그라디언트 + 반투명 이니셜 */}
        <div
          className="relative h-20 lg:h-28 flex items-center justify-center overflow-hidden"
          style={{ background: getTeamGradient(team.primary_color) }}
        >
          {/* 팀 이니셜 (큰 반투명 텍스트, 배경 장식용) */}
          <span className="text-4xl lg:text-5xl font-black text-white/30 select-none">
            {getInitials(team.name)}
          </span>

          {/* 좌상단: shield 아이콘 뱃지 */}
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">
            <span className="material-symbols-outlined text-xs">shield</span>
          </span>

          {/* 우상단: 디비전/특수 배지 (TOP1/인기/신규 등) */}
          {badge && (
            <span
              className="absolute top-2 right-2 rounded px-2 py-0.5 text-xs font-black uppercase"
              style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
            >
              {badge}
            </span>
          )}

          {/* 우하단: 도시 뱃지 (경기 카드의 location 뱃지와 동일 패턴) */}
          {location && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">
              <span className="material-symbols-outlined text-xs">location_on</span>
              <span className="line-clamp-1 max-w-[120px]">{location}</span>
            </span>
          )}
        </div>

        {/* 정보 영역: p-3, 2행 */}
        <div className="p-3">
          {/* 1행: 팀명 + 전적 */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold line-clamp-1 flex-1 text-[var(--color-text-primary)]">
              {team.name}
            </h3>
            {/* 전적 NW NL 또는 모집중 표시 */}
            {total > 0 ? (
              <span className="shrink-0 text-xs font-bold text-[var(--color-text-secondary)]">
                {wins}W {losses}L
              </span>
            ) : team.accepting_members ? (
              <span className="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded bg-[var(--color-primary)] text-white">
                모집중
              </span>
            ) : null}
          </div>

          {/* 2행: 멤버 수 + 승률 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">
              멤버 {team.member_count}명
            </span>
            {total > 0 ? (
              <span className="text-xs font-bold text-[var(--color-primary)]">
                승률 {winRate}%
              </span>
            ) : (
              <span className="text-xs text-[var(--color-text-disabled)]">
                전적 없음
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// -- "새로운 팀 만들기" 카드 (컴팩트: 다른 팀 카드와 동일 높이) --
function CreateTeamCard() {
  return (
    <Link href="/teams/new" className="block h-full">
      <div className="border-2 border-dashed rounded-lg overflow-hidden flex flex-col items-center justify-center h-full transition-all cursor-pointer group border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)]">
        {/* + 아이콘 (축소: 32px) */}
        <div className="w-8 h-8 rounded-full border flex items-center justify-center mb-2 group-hover:scale-110 transition-all border-[var(--color-border)]">
          <span className="material-symbols-outlined text-xl text-[var(--color-text-muted)]">
            add
          </span>
        </div>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          팀 만들기
        </h3>
        <p className="text-xs text-[var(--color-text-disabled)]">
          BDR 리그에 도전
        </p>
      </div>
    </Link>
  );
}

// -- 페이지네이션 컴포넌트 --
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // 페이지 번호 배열 생성: 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded border transition-colors disabled:opacity-30"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {/* 페이지 번호들 */}
      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`dots-${idx}`}
            className="px-2"
            style={{ color: "var(--color-text-disabled)" }}
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-10 h-10 flex items-center justify-center rounded font-bold text-sm transition-colors"
            style={
              page === currentPage
                ? {
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-on-primary)",
                  }
                : {
                    borderWidth: "1px",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }
            }
          >
            {page}
          </button>
        )
      )}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded border transition-colors disabled:opacity-30"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

/**
 * TeamsContent - 팀 목록 클라이언트 컴포넌트 (리디자인)
 *
 * API 로직은 기존과 100% 동일하게 유지.
 * UI만 새 디자인 시안(bdr_3 다크 / bdr_4 라이트)에 맞춰 교체.
 */
export function TeamsContent({
  TeamsFilterComponent,
}: {
  TeamsFilterComponent: React.ComponentType<{ cities: string[]; totalCount: number }>;
}) {
  const searchParams = useSearchParams();

  const [teams, setTeams] = useState<TeamFromApi[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // 클라이언트 사이드 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // searchParams가 바뀔 때마다 API 호출 (기존 로직 그대로)
  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams(searchParams.toString());
    const url = `/api/web/teams?${params.toString()}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<TeamsApiResponse>;
      })
      .then((data) => {
        if (data) {
          setTeams(data.teams ?? []);
          setCities(data.cities ?? []);
        }
      })
      .catch(() => {
        setTeams([]);
        setCities([]);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  // 필터가 바뀌면 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  // 배지 계산 (팀 목록이 바뀔 때만 재계산)
  const badgeMap = useMemo(() => computeBadges(teams), [teams]);

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(teams.length / TEAMS_PER_PAGE));
  const paginatedTeams = teams.slice(
    (currentPage - 1) * TEAMS_PER_PAGE,
    currentPage * TEAMS_PER_PAGE
  );

  return (
    <>
      {/* 헤더 영역: "팀 목록" + 부제 */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          팀 목록
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          BDR 플랫폼에 등록된 역동적인 팀들을 만나보세요.
        </p>
      </div>

      {/* 필터: 검색 인라인 + 플로팅 필터 트리거 */}
      <TeamsFilterComponent cities={cities} totalCount={teams.length} />

      {/* 로딩 중이면 스켈레톤 표시 */}
      {loading ? (
        <TeamsGridSkeleton />
      ) : (
        <>
          {/* 팀 카드 그리드: 4열 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedTeams.map((team) => (
              <TeamCardRedesigned
                key={team.id}
                team={team}
                badge={badgeMap.get(team.id) ?? null}
              />
            ))}

            {/* "새로운 팀 만들기" 카드: 항상 마지막에 표시 */}
            <CreateTeamCard />

            {/* 빈 상태 */}
            {teams.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <span
                  className="material-symbols-outlined text-5xl mb-3 block"
                  style={{ color: "var(--color-text-disabled)" }}
                >
                  sports_basketball
                </span>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  {searchParams.get("q") || searchParams.get("city")
                    ? "조건에 맞는 팀이 없습니다."
                    : "등록된 팀이 없습니다."}
                </p>
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              // 페이지 전환 시 스크롤 상단으로
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </>
  );
}
