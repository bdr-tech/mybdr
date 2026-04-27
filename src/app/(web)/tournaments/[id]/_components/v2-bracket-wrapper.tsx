"use client";

/**
 * 대진표 v2 — 통합 래퍼 (헤더 + Status Bar + 메인 트리 + 사이드 3카드)
 *
 * 시안: Bracket.jsx 전체 구조
 *  ┌─────────────────────────────────────┐
 *  │ V2BracketHeader (eyebrow/h1/select) │
 *  ├─────────────────────────────────────┤
 *  │ V2BracketStatusBar (5칸)            │
 *  ├──────────────────────┬──────────────┤
 *  │                      │ SeedRanking  │
 *  │  메인 트리 영역      │              │
 *  │  (포맷별 분기 유지)  │              │
 *  │                      ├──────────────┤
 *  │                      │ Prediction   │
 *  ├──────────────────────┤              │
 *  │  ScheduleList        │              │
 *  └──────────────────────┴──────────────┘
 *
 * 결정 (이번 세션):
 *  1. B: 헤더·Status·사이드 v2 공통, 메인 트리만 포맷별 분기
 *  2. SVG 트리 유지 (BracketView 그대로 사용)
 *  3. 우승 예측 카드 유지 + "투표 준비 중"
 *  4. 대회 select 유지 — 같은 series_id 내 회차 라우팅
 *
 * API/Prisma/서비스 레이어 0 변경. 기존 BracketView/LeagueStandings/GroupStandings/
 * FinalsSidebar/BracketEmpty 등도 0 수정.
 */

import useSWR from "swr";
// 변환 유틸 — apiSuccess()의 snake_case 응답을 camelCase로
import { convertKeysToCamelCase } from "@/lib/utils/case";
import { Skeleton } from "@/components/ui/skeleton";

// 기존 컴포넌트 그대로 재사용 (메인 트리 영역만)
import { BracketView } from "../bracket/_components/bracket-view";
import { BracketEmpty } from "../bracket/_components/bracket-empty";
import { GroupStandings, type GroupTeam } from "../bracket/_components/group-standings";
import { LeagueStandings, type LeagueTeam } from "../bracket/_components/league-standings";

// v2 신규 컴포넌트
import { V2BracketHeader, type SeriesEdition } from "./v2-bracket-header";
import { V2BracketStatusBar } from "./v2-bracket-status-bar";
import { V2BracketScheduleList } from "./v2-bracket-schedule-list";
import { V2BracketSeedRanking, type SeedTeam } from "./v2-bracket-seed-ranking";
import { V2BracketPrediction } from "./v2-bracket-prediction";

// API 응답 fetcher — 기존 tournament-tabs.tsx와 동일 패턴
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- API 응답 구조 다양
type ApiResponse = Record<string, any>;
const fetcher = (url: string): Promise<ApiResponse> =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`);
      return r.json();
    })
    .then((json) => convertKeysToCamelCase(json) as ApiResponse);

// 라운드 라벨 → 한국어 단축형 ("8강", "준결승" 등)
// "Quarterfinals" / "QF" / "Semifinal" 등 다양한 표기 → 통일
function shortRoundLabel(roundName: string | null | undefined): string {
  if (!roundName) return "-";
  const lower = String(roundName).toLowerCase();
  if (lower.includes("final") && !lower.includes("semi") && !lower.includes("quarter"))
    return "결승";
  if (lower.includes("semi")) return "준결승";
  if (lower.includes("quarter") || lower === "qf") return "8강";
  // "Round of 16" 패턴
  if (lower.includes("16")) return "16강";
  if (lower.includes("32")) return "32강";
  return roundName; // 한국어 그대로면 통과 (예: "8강", "결승")
}

// 토너먼트 포맷 → eyebrow 라벨
function formatToEyebrow(format: string | null): string {
  if (!format) return "BRACKET";
  const norm = format.toLowerCase().replace(/-/g, "_");
  switch (norm) {
    case "single_elimination":
      return "BRACKET · SINGLE ELIMINATION";
    case "double_elimination":
      return "BRACKET · DOUBLE ELIMINATION";
    case "round_robin":
    case "full_league":
      return "BRACKET · ROUND ROBIN";
    case "full_league_knockout":
      return "BRACKET · LEAGUE + KNOCKOUT";
    case "group_stage_knockout":
      return "BRACKET · GROUP + KNOCKOUT";
    default:
      return `BRACKET · ${format.toUpperCase()}`;
  }
}

// 부제 한 줄 조립 — "8팀 · {format} · {start ~ end} · {venue}"
function buildSubtitle(opts: {
  totalTeams: number;
  format: string | null;
  startDate: Date | null;
  endDate: Date | null;
  venueName: string | null;
}): string {
  const parts: string[] = [];
  if (opts.totalTeams > 0) parts.push(`${opts.totalTeams}팀`);

  const formatKor = (() => {
    const norm = opts.format?.toLowerCase().replace(/-/g, "_") ?? "";
    switch (norm) {
      case "single_elimination":
        return "싱글 엘리미네이션";
      case "double_elimination":
        return "더블 엘리미네이션";
      case "round_robin":
      case "full_league":
        return "풀리그";
      case "full_league_knockout":
        return "풀리그 + 토너먼트";
      case "group_stage_knockout":
        return "조별 + 토너먼트";
      default:
        return null;
    }
  })();
  if (formatKor) parts.push(formatKor);

  if (opts.startDate || opts.endDate) {
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}.${m}.${dd}`;
    };
    if (opts.startDate && opts.endDate) {
      parts.push(`${fmt(opts.startDate)} ~ ${fmt(opts.endDate)}`);
    } else if (opts.startDate) {
      parts.push(fmt(opts.startDate));
    }
  }

  if (opts.venueName) parts.push(opts.venueName);

  return parts.join(" · ");
}

interface V2BracketWrapperProps {
  tournamentId: string;
  // 헤더용 — page.tsx에서 서버 props로 전달
  tournamentName: string;
  editionNumber: number | null;
  startDate: Date | null;
  endDate: Date | null;
  venueName: string | null;
  // 시리즈 select 옵션 (같은 series_id 내 회차) — 1개 이하면 select 자동 disabled
  seriesEditions: SeriesEdition[];
}

export function V2BracketWrapper({
  tournamentId,
  tournamentName,
  editionNumber,
  startDate,
  endDate,
  venueName,
  seriesEditions,
}: V2BracketWrapperProps) {
  // 기존 BracketTabContent와 동일한 API 호출
  const { data, isLoading, error } = useSWR(
    `/api/web/tournaments/${tournamentId}/public-bracket`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // 헤더는 SSR/초기 렌더에서도 즉시 표시되도록 SWR 의존 제거.
  // (이유: 헤더는 page.tsx에서 받은 서버 props만으로도 충분히 그려짐 → 첫 페인트 UX 개선)
  // 데이터(SWR) 로딩/에러 상태는 Status Bar 이하 영역에서만 처리.

  // ========================================
  // 데이터 준비 (기존 BracketTabContent 로직 그대로)
  // 데이터 없을 땐 모든 값을 기본값(0/빈배열)으로 폴백 — 컴포넌트들은 빈 상태 자동 처리
  // ========================================
  const d = data ?? {};
  const groupTeams: GroupTeam[] = d.groupTeams ?? [];
  const rounds = d.rounds ?? [];
  const leagueTeams: LeagueTeam[] = d.leagueTeams ?? [];
  const totalTeams: number = d.totalTeams ?? 0;
  const liveMatchCount: number = d.liveMatchCount ?? 0;
  const totalMatches: number = d.totalMatches ?? 0;
  const completedMatches: number = d.completedMatches ?? 0;

  // 포맷 정규화
  const format: string | null = d.format
    ? (d.format as string).toLowerCase().replace(/-/g, "_")
    : null;
  const isLeague =
    format === "round_robin" ||
    format === "full_league" ||
    format === "full_league_knockout";

  const hasLeagueData = isLeague && leagueTeams.length > 0;
  const hasKnockout = rounds.length > 0;

  // 현재 라운드 라벨 — 미완료 매치 첫 번째 라운드, 없으면 마지막 라운드
  const currentRoundLabel = (() => {
    if (rounds.length === 0) return null;
    // 진행 중(in_progress) 매치가 있는 라운드 우선
    type R = { roundName: string; matches: { status: string }[] };
    const liveRound = (rounds as R[]).find((r) =>
      r.matches.some((m) => m.status === "in_progress")
    );
    if (liveRound) return shortRoundLabel(liveRound.roundName);
    // 아직 완료되지 않은 매치가 있는 첫 라운드
    const pendingRound = (rounds as R[]).find((r) =>
      r.matches.some((m) => m.status !== "completed")
    );
    if (pendingRound) return shortRoundLabel(pendingRound.roundName);
    // 모두 완료면 마지막 라운드
    return shortRoundLabel((rounds as R[])[rounds.length - 1].roundName);
  })();

  // 시드 순위 데이터 — leagueTeams 우선, 없으면 groupTeams, 둘 다 없으면 카드 자체 미표시
  // (사이드의 시드 순위는 본선 8팀 정렬이 시안의 의도이므로 둘 다 없으면 의미 없음)
  const seedTeams: SeedTeam[] = (() => {
    if (leagueTeams.length > 0) {
      return leagueTeams.map((t) => ({
        id: t.id,
        teamId: t.teamId,
        teamName: t.teamName,
        wins: t.wins,
      }));
    }
    if (groupTeams.length > 0) {
      // 조별은 wins 내림차순으로 재정렬 (이미 정렬되어 있지만 안전하게)
      return [...groupTeams]
        .sort((a, b) => b.wins - a.wins)
        .map((t) => ({
          id: t.id,
          teamId: t.teamId,
          teamName: t.teamName,
          wins: t.wins,
        }));
    }
    return [];
  })();

  // 헤더 props 조립
  const eyebrow = formatToEyebrow(d.format ?? null);
  // 회차 라벨이 있으면 "Vol.N · 본선" 형태, 없으면 대회명만
  const titleSuffix = editionNumber ? `Vol.${editionNumber} · 본선` : "";
  const title = titleSuffix ? `${tournamentName} ${titleSuffix}` : tournamentName;
  const subtitle = buildSubtitle({
    totalTeams,
    format: d.format ?? null,
    startDate,
    endDate,
    venueName,
  });

  return (
    <div>
      {/* 1. 헤더 (eyebrow + h1 + 부제 + select + 액션 버튼) */}
      <V2BracketHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        seriesEditions={seriesEditions}
        currentTournamentId={tournamentId}
      />

      {/* 2. Status Bar (5칸) — 로딩 시 스켈레톤, 에러 시 경량 안내 */}
      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-md" />
      ) : error ? (
        <div
          className="rounded-md border p-4 text-center text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
            color: "var(--color-text-muted)",
          }}
        >
          대진표 데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      ) : (
        <V2BracketStatusBar
          totalTeams={totalTeams}
          completedMatches={completedMatches}
          totalMatches={totalMatches}
          liveMatchCount={liveMatchCount}
          currentRoundLabel={currentRoundLabel}
          // 우승상금: tournament.prize_money 미존재 → 항상 null
          prizeMoney={null}
        />
      )}

      {/* 3. 메인 트리 + 사이드 (반응형 grid)
          - 데스크톱(lg+): 좌(메인 트리 + 일정 리스트) | 우(사이드 3카드)
          - 모바일/태블릿: 단일 칼럼
          - 로딩/에러 시에는 메인 영역만 스켈레톤 처리 (헤더는 이미 보임)
       */}
      {isLoading ? (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-96 w-full rounded-md" />
        </div>
      ) : error ? null : (
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* 좌측: 메인 트리 영역 + 경기 일정 리스트 */}
        <div className="min-w-0 flex flex-col gap-5">
          {/* 메인 트리 — 포맷별 분기 (기존 BracketTabContent 로직 그대로) */}
          <div
            className="rounded-md border p-4 sm:p-6 overflow-x-auto"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            {hasLeagueData ? (
              <>
                {/* 풀리그: 리그 순위표 (4강 진출 조편성 기준) */}
                <LeagueStandings teams={leagueTeams} tournamentStatus={d.tournamentStatus} />

                {/* full_league_knockout만 4강 토너먼트 영역 */}
                {format === "full_league_knockout" &&
                  (hasKnockout ? (
                    <section className="mt-8">
                      <h3
                        className="mb-4 text-lg font-bold sm:text-xl"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        4강 토너먼트
                      </h3>
                      <BracketView rounds={rounds} tournamentId={tournamentId} />
                    </section>
                  ) : (
                    <section className="mt-8">
                      <div
                        className="rounded-md border p-6 text-center"
                        style={{
                          borderColor: "var(--color-border)",
                          backgroundColor: "var(--color-surface)",
                        }}
                      >
                        <span
                          className="material-symbols-outlined mb-2 text-4xl"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          account_tree
                        </span>
                        <h3 className="mb-2 text-base font-bold">토너먼트 대진</h3>
                        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                          리그 종료 후 1-4위, 2-3위가 맞붙는 4강이 확정됩니다.
                        </p>
                      </div>
                    </section>
                  ))}
              </>
            ) : (
              <>
                {/* 조별 단계 (있으면) */}
                {groupTeams.length > 0 && <GroupStandings teams={groupTeams} />}

                {/* 토너먼트 트리 — SVG 유지 (BracketView 그대로) */}
                {hasKnockout ? (
                  <BracketView rounds={rounds} tournamentId={tournamentId} />
                ) : (
                  <BracketEmpty tournamentId={tournamentId} />
                )}
              </>
            )}
          </div>

          {/* 경기 일정 리스트 — 토너먼트 트리(rounds)가 있을 때만 표시
              풀리그 단독은 LeagueSchedule 영역이 별도이므로 시안의 일정 리스트는 토너먼트용
           */}
          {hasKnockout && <V2BracketScheduleList rounds={rounds} />}
        </div>

        {/* 우측: 사이드 3카드 (시드 순위 / 우승 예측) */}
        <aside className="flex flex-col gap-4">
          {/* 시드 순위 — 데이터 있을 때만 (없으면 카드 자체 미표시) */}
          {seedTeams.length > 0 && <V2BracketSeedRanking teams={seedTeams} />}

          {/* 우승 예측 — 사용자 원칙: 자리 유지 + "투표 준비 중" placeholder
              데이터(predictions) 미전달 → 컴포넌트 내부에서 placeholder 모드 자동 표시 */}
          <V2BracketPrediction />
        </aside>
      </div>
      )}
    </div>
  );
}
