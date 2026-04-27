"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCardV2 } from "./team-card-v2";

// Phase 3 Teams — v2 시안 적용 목록 컨테이너
// 원칙:
//  - API/데이터 패칭 0 변경 (/api/web/teams 그대로 호출)
//  - 기존 teams-content.tsx / team-card.tsx / teams-filter.tsx 보존
//  - 기존 플로팅 필터(TeamsFilter) 유지 + 시안 내장 검색박스 추가 (두 검색은 URL q 쿼리 공유)
//  - rating/tag 등 가짜 수치 금지 (wins 기반)

interface TeamFromApi {
  id: string;
  name: string;
  name_en: string | null;
  name_primary: string | null;
  primary_color: string | null;
  secondary_color: string | null;
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

// 페이지당 팀 수 — 시안은 auto-fill 그리드라 고정 열 수가 없지만
// 260px min × 4~5열 × 2~3행 기준 12장이 적정.
const TEAMS_PER_PAGE = 12;

// 스켈레톤 (v2 카드 비율 유지: 상단 98px + 본문 stat + 하단 버튼 → 약 h-64)
function TeamsListSkeletonV2() {
  return (
    <div
      className="mt-4"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 14,
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-[10px]" />
      ))}
    </div>
  );
}

// 페이지네이션 (기존 teams-content.tsx 와 동일 구조 — 재사용 대신 v2 스타일로 맞춰 복사)
function PaginationV2({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

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
        className="btn btn--sm"
        style={{ opacity: currentPage === 1 ? 0.3 : 1, minWidth: 40 }}
        aria-label="이전 페이지"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`dots-${idx}`}
            className="px-2"
            style={{ color: "var(--ink-dim)" }}
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={page === currentPage ? "btn btn--primary btn--sm" : "btn btn--sm"}
            style={{ minWidth: 40 }}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn--sm"
        style={{ opacity: currentPage === totalPages ? 0.3 : 1, minWidth: 40 }}
        aria-label="다음 페이지"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

/**
 * TeamsContentV2 — v2 시안 레이아웃
 *
 * 구조:
 *  1) 헤더 (eyebrow + "등록 팀 N팀" + 메타 + 우측: 내장 검색 + 팀 등록 버튼)
 *  2) 플로팅 필터 유지 (기존 TeamsFilter — 지역/정렬)
 *  3) auto-fill minmax(260px,1fr) 그리드 + TeamCardV2
 *  4) 페이지네이션
 */
export function TeamsContentV2({
  TeamsFilterComponent,
}: {
  TeamsFilterComponent: React.ComponentType<{ cities: string[]; totalCount: number }>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [teams, setTeams] = useState<TeamFromApi[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // 내장 검색박스(시안 우측 chip) — URL q 쿼리와 동기화
  // 이유: 기존 플로팅 필터에도 검색이 있지만 시안은 헤더 우측에 검색 chip 이 있음.
  // 동일 q 파라미터를 공유하므로 두 입력이 일관되게 동작.
  const [searchLocal, setSearchLocal] = useState<string>(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // 필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  // URL q 가 외부(플로팅 필터)에서 바뀌면 로컬 검색 input 동기화
  useEffect(() => {
    setSearchLocal(searchParams.get("q") ?? "");
  }, [searchParams]);

  // 내장 검색박스 변경 핸들러 (debounce 380ms — 플로팅 필터와 동일)
  const handleInlineSearch = (v: string) => {
    setSearchLocal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString());
      if (v) sp.set("q", v);
      else sp.delete("q");
      router.push(`${pathname}?${sp.toString()}`);
    }, 380);
  };

  // wins desc 로 정렬한 뒤 index 를 카드에 부여 → 시안의 #랭크 표시
  // 이유: 기존 API가 sort=wins 일 때 이미 wins desc 정렬해서 내려주지만,
  // 정렬 옵션이 "최신순/승률순" 이어도 "#랭크" 는 항상 wins 기준이어야 의미가 통일됨.
  // 현재 기본 정렬이 wins 이고, URL에 sort 파라미터가 붙어도 팀별 고유 랭크 의미를 유지하기 위해
  // 프론트에서 wins desc 로 한 번 더 정렬한 맵을 만들어 rankIndex 를 매긴다.
  const rankMap = useMemo(() => {
    const m = new Map<string, number>();
    const sorted = [...teams].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
    sorted.forEach((t, i) => m.set(t.id, i + 1));
    return m;
  }, [teams]);

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(teams.length / TEAMS_PER_PAGE));
  const paginatedTeams = teams.slice(
    (currentPage - 1) * TEAMS_PER_PAGE,
    currentPage * TEAMS_PER_PAGE
  );

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* v2 헤더 — 시안 L7~L20 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="eyebrow">팀 · TEAMS</div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
            }}
          >
            등록 팀 {teams.length}팀
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            레이팅 순 · 2026 시즌 기준
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* 시안 내장 검색 chip — URL q 와 동기화 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 10px",
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-chip)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: "var(--ink-mute)" }}
            >
              search
            </span>
            <input
              className="input"
              style={{
                border: 0,
                padding: 0,
                background: "transparent",
                width: 180,
                fontSize: 13,
                color: "var(--ink)",
                outline: "none",
              }}
              placeholder="팀 이름·태그 검색"
              value={searchLocal}
              onChange={(e) => handleInlineSearch(e.target.value)}
            />
          </div>

          {/* 팀 등록 버튼 — 기존 /teams/new 라우트 유지 */}
          <Link href="/teams/new" className="btn btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              add
            </span>
            팀 등록
          </Link>
        </div>
      </div>

      {/* 기존 플로팅 필터 (지역/정렬) — PM 결정: 데이터 조회 기능이라 보존 */}
      <TeamsFilterComponent cities={cities} totalCount={teams.length} />

      {loading ? (
        <TeamsListSkeletonV2 />
      ) : (
        <>
          {/* v2 그리드 — auto-fill minmax(260px, 1fr) (시안 L22) */}
          <div
            className="mt-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {paginatedTeams.map((team) => {
              // API snake_case → 카드 입력 타입으로 변환
              const cardData = {
                id: team.id,
                name: team.name,
                name_en: team.name_en,
                primaryColor: team.primary_color,
                secondaryColor: team.secondary_color,
                logoUrl: team.logo_url,
                city: team.city,
                district: team.district,
                wins: team.wins ?? 0,
                losses: team.losses ?? 0,
                accepting_members: team.accepting_members,
                created_at: team.created_at ?? null,
                rankIndex: rankMap.get(team.id) ?? 0,
              };
              return <TeamCardV2 key={team.id} team={cardData} />;
            })}
          </div>

          {/* 빈 상태 */}
          {teams.length === 0 && (
            <div className="py-16 text-center">
              <span
                className="material-symbols-outlined text-5xl mb-3 block"
                style={{ color: "var(--ink-dim)" }}
              >
                sports_basketball
              </span>
              <p className="text-sm mb-4" style={{ color: "var(--ink-mute)" }}>
                {searchParams.get("q") || searchParams.get("city")
                  ? "조건에 맞는 팀이 없습니다"
                  : "등록된 팀이 없습니다"}
              </p>
              <Link href="/teams/new" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  add
                </span>
                팀 만들기
              </Link>
            </div>
          )}

          <PaginationV2
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
