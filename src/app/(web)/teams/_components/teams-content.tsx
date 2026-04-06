"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { TossListItem } from "@/components/toss/toss-list-item";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
import { TossCard } from "@/components/toss/toss-card";

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

// -- 배지 색상 매핑 (토스 스타일: 연한 배경 + 진한 텍스트) --
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

// -- 팀명에서 이니셜 추출 (한글: 첫 2글자, 영문: 각 단어 첫 글자) --
function getInitials(name: string): string {
  if (/^[가-힣]/.test(name)) return name.slice(0, 2);
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// -- 스켈레톤 UI: 토스 리스트 스타일 --
function TeamsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-4 px-1">
          {/* 원형 아이콘 스켈레톤 */}
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          {/* 텍스트 영역 */}
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          {/* 우측 값 */}
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

// -- 페이지네이션 컴포넌트 (토스 스타일: 더 둥글고 가벼운 느낌) --
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

  // 페이지 번호 배열 생성
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
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-md transition-colors disabled:opacity-30"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

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
            className="w-10 h-10 flex items-center justify-center rounded-md font-bold text-sm transition-colors"
            style={
              page === currentPage
                ? {
                    backgroundColor: "var(--color-primary)",
                    color: "#FFFFFF",
                  }
                : {
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-secondary)",
                  }
            }
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-md transition-colors disabled:opacity-30"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

/**
 * TeamsContent - 팀 목록 (토스 스타일 리스트)
 *
 * 변경: 2열 그리드 카드 -> TossListItem 리스트 (원형 팀 색상 아이콘 + 팀명/도시 + 멤버수/전적)
 * API 로직은 기존과 100% 동일하게 유지.
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
    /* 토스 스타일: 1열 세로 스택, 최대 640px */
    <div className="max-w-[640px] mx-auto">
      {/* 헤더 영역: 토스 스타일 간결한 제목 */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          팀 목록
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          BDR 플랫폼에 등록된 역동적인 팀들을 만나보세요
        </p>
      </div>

      {/* 필터: 검색 인라인 + 플로팅 필터 트리거 */}
      <TeamsFilterComponent cities={cities} totalCount={teams.length} />

      {/* 로딩 중이면 스켈레톤 표시 */}
      {loading ? (
        <TeamsListSkeleton />
      ) : (
        <>
          {/* 팀 리스트: TossListItem 패턴 */}
          <TossCard className="p-0 mt-4">
            {paginatedTeams.map((team) => {
              const accent = resolveAccent(team.primary_color, team.secondary_color);
              const wins = team.wins ?? 0;
              const losses = team.losses ?? 0;
              const total = wins + losses;
              const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
              const location = [team.city, team.district].filter(Boolean).join(" ");
              const badge = badgeMap.get(team.id) ?? null;
              const badgeStyle = getBadgeStyle(badge);

              return (
                <Link key={team.id} href={`/teams/${team.id}`} className="block">
                  <div
                    className="flex items-center gap-3 py-4 px-5 transition-colors hover:bg-[var(--color-surface-bright)] border-b border-[var(--color-border-subtle)] last:border-b-0"
                  >
                    {/* 좌: 원형 팀 색상 아이콘 (40px) */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: accent }}
                    >
                      <span className="text-xs font-bold text-white select-none">
                        {getInitials(team.name)}
                      </span>
                    </div>

                    {/* 중: 팀명 + 부가정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {team.name}
                        </p>
                        {/* 배지: TOP1/인기/신규 등 */}
                        {badge && (
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                          >
                            {badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                        {location || "지역 미설정"} · 멤버 {team.member_count}명
                      </p>
                    </div>

                    {/* 우: 전적 + 화살표 */}
                    <div className="flex items-center gap-2 shrink-0">
                      {total > 0 ? (
                        <div className="text-right">
                          <p className="text-sm font-bold text-[var(--color-text-primary)]">
                            {wins}W {losses}L
                          </p>
                          <p className="text-xs text-[var(--color-primary)]">
                            {winRate}%
                          </p>
                        </div>
                      ) : team.accepting_members ? (
                        <span
                          className="text-xs font-bold px-2 py-1 rounded"
                          style={{ backgroundColor: "var(--color-primary)", color: "#FFFFFF" }}
                        >
                          모집중
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-disabled)]">
                          전적 없음
                        </span>
                      )}
                      <span className="material-symbols-outlined text-lg text-[var(--color-text-disabled)]">
                        chevron_right
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* 빈 상태 + CTA */}
            {teams.length === 0 && (
              <div className="py-16 text-center">
                <span
                  className="material-symbols-outlined text-5xl mb-3 block"
                  style={{ color: "var(--color-text-disabled)" }}
                >
                  sports_basketball
                </span>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  {searchParams.get("q") || searchParams.get("city")
                    ? "조건에 맞는 팀이 없습니다"
                    : "등록된 팀이 없습니다"}
                </p>
                {/* 빈 상태 액션 버튼: 팀 만들기 */}
                <Link
                  href="/teams/new"
                  className="inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.97]"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  팀 만들기
                </Link>
              </div>
            )}
          </TossCard>

          {/* 새 팀 만들기: 토스 스타일 하단 CTA */}
          <Link href="/teams/new" className="block mt-6">
            <div
              className="flex items-center justify-center gap-2 py-4 rounded-md border-2 border-dashed transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)]"
              style={{ borderColor: "var(--color-border)" }}
            >
              <span className="material-symbols-outlined text-xl text-[var(--color-text-muted)]">
                add_circle
              </span>
              <span className="text-sm font-bold text-[var(--color-text-muted)]">
                새 팀 만들기
              </span>
            </div>
          </Link>

          {/* 페이지네이션 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
}
