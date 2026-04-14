"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
// 팀 목록 카드 그리드용: 기존 TeamCard 재사용 (로고/지역/전적/멤버/모집 뱃지)
import { TeamCard } from "./team-card";

// API에서 내려오는 팀 데이터 타입 (apiSuccess가 snake_case로 자동 변환)
interface TeamFromApi {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  // 로고 URL — API가 snake_case로 내려줌 (apiSuccess 자동 변환)
  logo_url: string | null;
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

// -- 페이지당 팀 수 (4열 그리드 2행 = 8 또는 3행 = 12) --
const TEAMS_PER_PAGE = 12;

// -- 스켈레톤 UI: 카드 그리드 스타일 (모바일 2열 / 태블릿 3열 / PC 4열) --
function TeamsListSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-[16px]" />
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

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(teams.length / TEAMS_PER_PAGE));
  const paginatedTeams = teams.slice(
    (currentPage - 1) * TEAMS_PER_PAGE,
    currentPage * TEAMS_PER_PAGE
  );

  return (
    /* 카드 그리드 수용을 위해 최대 너비 확장 (모바일~PC 반응형) */
    <div className="max-w-[1200px] mx-auto">
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
          {/* 팀 카드 그리드 — 모바일 2열 / 태블릿 3열 / PC 4열 */}
          {/* TeamCard 재사용: 로고/팀명/지역/전적/멤버/모집중 뱃지 포함 */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {paginatedTeams.map((team) => {
              // TeamFromApi(snake_case) → TeamCard의 TeamCardData(camelCase/mixed) 변환
              const cardData = {
                id: BigInt(team.id),
                name: team.name,
                primaryColor: team.primary_color,
                secondaryColor: team.secondary_color,
                // 로고 URL — snake_case(logo_url) → camelCase(logoUrl) 변환하여 전달
                logoUrl: team.logo_url,
                city: team.city,
                district: team.district,
                wins: team.wins,
                losses: team.losses,
                accepting_members: team.accepting_members,
                tournaments_count: team.tournaments_count,
                _count: { teamMembers: team.member_count },
              };
              return <TeamCard key={team.id} team={cardData} />;
            })}
          </div>

          {/* 빈 상태 + CTA — 그리드 밖으로 분리 (gap 영향 없이 중앙 정렬) */}
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
