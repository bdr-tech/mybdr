"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BdrRankingTable } from "./bdr-ranking-table";

/* ============================================================
 * 타입 정의 (API 응답은 apiSuccess가 snake_case로 자동 변환)
 * ============================================================ */

// 팀 랭킹 API 응답 항목
interface TeamRanking {
  rank: number;
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  city: string | null;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  member_count: number;
  tournaments_count: number;
}

// 개인 랭킹 API 응답 항목
interface PlayerRanking {
  rank: number;
  user_id: string;
  name: string;
  team_name: string;
  games_played: number;
  total_points: number;
  avg_points: number;
  total_rebounds: number;
  total_assists: number;
}

// 탭 종류: 기존 team/player는 유지하되 UI에서 숨김, BDR 탭 추가
type TabType = "team" | "player" | "bdr-general" | "bdr-university";

// 페이지당 항목 수
const ITEMS_PER_PAGE = 20;

/* ============================================================
 * 유틸리티 함수
 * ============================================================ */

// 팀 색상 결정: 흰색이면 보조색 사용
function resolveColor(primary: string | null, secondary?: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return secondary ?? "var(--color-primary)";
  }
  return primary;
}

/* ============================================================
 * 테이블 스켈레톤 (로딩 중 표시)
 * ============================================================ */
function TableSkeleton() {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div className="px-4 py-3" style={{ backgroundColor: "var(--color-elevated)" }}>
        <Skeleton className="h-4 w-full" />
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * 페이지네이션 컴포넌트 (teams-content.tsx 패턴 동일)
 * ============================================================ */
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

  // 페이지 번호 배열: 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
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
    <div className="mt-8 flex items-center justify-center gap-2">
      {/* 이전 페이지 */}
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

      {/* 페이지 번호 */}
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

      {/* 다음 페이지 */}
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

/* ============================================================
 * 팀 랭킹 테이블
 * ============================================================ */
function TeamRankingTable({ teams }: { teams: TeamRanking[] }) {
  if (teams.length === 0) {
    return (
      <div className="py-20 text-center">
        <span
          className="material-symbols-outlined text-5xl mb-3 block"
          style={{ color: "var(--color-text-disabled)" }}
        >
          groups
        </span>
        <p style={{ color: "var(--color-text-secondary)" }}>
          등록된 팀 랭킹이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        {/* 테이블 헤더 */}
        <thead>
          <tr
            className="text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--color-elevated)",
              color: "var(--color-text-muted)",
            }}
          >
            <th className="px-4 py-3 text-center w-14">#</th>
            <th className="px-4 py-3 text-left">팀</th>
            <th className="px-4 py-3 text-center w-16">승</th>
            <th className="px-4 py-3 text-center w-16">패</th>
            <th className="px-4 py-3 text-center w-16">무</th>
            <th className="px-4 py-3 text-center w-20">승률</th>
            <th className="px-4 py-3 text-center w-16">멤버</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const accent = resolveColor(team.primary_color, team.secondary_color);
            return (
              <tr
                key={team.id}
                className="transition-colors hover:bg-[var(--color-elevated)]"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                {/* 순위 */}
                <td className="px-4 py-3 text-center">
                  <span
                    className="text-sm font-black"
                    style={{
                      // 1~3위는 프라이머리 색상으로 강조
                      color:
                        team.rank <= 3
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {team.rank}
                  </span>
                </td>

                {/* 팀명 (색상 원 + 이름 + 도시) */}
                <td className="px-4 py-3">
                  <Link
                    href={`/teams/${team.id}`}
                    className="flex items-center gap-3 group"
                  >
                    {/* 팀 색상 원 */}
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: accent }}
                    >
                      <span className="material-symbols-outlined text-sm text-white">
                        groups
                      </span>
                    </div>
                    <div>
                      <p
                        className="text-sm font-bold group-hover:underline"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {team.name}
                      </p>
                      {team.city && (
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-disabled)" }}
                        >
                          {team.city}
                        </p>
                      )}
                    </div>
                  </Link>
                </td>

                {/* 승 */}
                <td
                  className="px-4 py-3 text-center text-sm font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {team.wins}
                </td>

                {/* 패 */}
                <td
                  className="px-4 py-3 text-center text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {team.losses}
                </td>

                {/* 무 */}
                <td
                  className="px-4 py-3 text-center text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {team.draws}
                </td>

                {/* 승률 */}
                <td className="px-4 py-3 text-center">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {team.win_rate}%
                  </span>
                </td>

                {/* 멤버 */}
                <td
                  className="px-4 py-3 text-center text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {team.member_count}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
 * 개인 랭킹 테이블
 * ============================================================ */
function PlayerRankingTable({ players }: { players: PlayerRanking[] }) {
  if (players.length === 0) {
    return (
      <div className="py-20 text-center">
        <span
          className="material-symbols-outlined text-5xl mb-3 block"
          style={{ color: "var(--color-text-disabled)" }}
        >
          person
        </span>
        <p style={{ color: "var(--color-text-secondary)" }}>
          등록된 선수 랭킹이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        {/* 테이블 헤더 */}
        <thead>
          <tr
            className="text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--color-elevated)",
              color: "var(--color-text-muted)",
            }}
          >
            <th className="px-4 py-3 text-center w-14">#</th>
            <th className="px-4 py-3 text-left">선수</th>
            <th className="px-4 py-3 text-center w-16">경기</th>
            <th className="px-4 py-3 text-center w-20">총득점</th>
            <th className="px-4 py-3 text-center w-20">평균</th>
            <th className="px-4 py-3 text-center w-20">리바운드</th>
            <th className="px-4 py-3 text-center w-20">어시스트</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr
              key={player.user_id}
              className="transition-colors hover:bg-[var(--color-elevated)]"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              {/* 순위 */}
              <td className="px-4 py-3 text-center">
                <span
                  className="text-sm font-black"
                  style={{
                    color:
                      player.rank <= 3
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
                  }}
                >
                  {player.rank}
                </span>
              </td>

              {/* 선수명 (이니셜 원 + 이름 + 소속팀) */}
              <td className="px-4 py-3">
                <Link
                  href={`/users/${player.user_id}`}
                  className="flex items-center gap-3 group"
                >
                  {/* 이니셜 원 */}
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {player.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold group-hover:underline"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {player.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-disabled)" }}
                    >
                      {player.team_name}
                    </p>
                  </div>
                </Link>
              </td>

              {/* 경기수 */}
              <td
                className="px-4 py-3 text-center text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {player.games_played}
              </td>

              {/* 총득점 */}
              <td
                className="px-4 py-3 text-center text-sm font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {player.total_points}
              </td>

              {/* 평균득점 */}
              <td className="px-4 py-3 text-center">
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  {player.avg_points}
                </span>
              </td>

              {/* 리바운드 */}
              <td
                className="px-4 py-3 text-center text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {player.total_rebounds}
              </td>

              {/* 어시스트 */}
              <td
                className="px-4 py-3 text-center text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {player.total_assists}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
 * 메인 컴포넌트: RankingsContent
 * - 탭 전환 (팀 랭킹 / 개인 랭킹)
 * - API 호출 + 클라이언트 페이지네이션
 * ============================================================ */
export function RankingsContent() {
  // 현재 활성 탭 — 기본값을 BDR 일반부로 변경
  const [activeTab, setActiveTab] = useState<TabType>("bdr-general");
  // 데이터 상태
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([]);
  const [playerRankings, setPlayerRankings] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // 탭이 바뀌면 해당 데이터를 API에서 가져옴
  // BDR 탭은 자체 컴포넌트가 데이터를 관리하므로 기존 team/player만 fetch
  useEffect(() => {
    // BDR 탭이면 기존 API 호출 불필요 (BdrRankingTable이 자체 fetch)
    if (activeTab.startsWith("bdr-")) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setCurrentPage(1); // 탭 전환 시 1페이지로 리셋

    fetch(`/api/web/rankings?type=${activeTab}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) {
          if (activeTab === "team") {
            setTeamRankings(data.rankings ?? []);
          } else {
            setPlayerRankings(data.rankings ?? []);
          }
        }
      })
      .catch(() => {
        // API 에러 시 빈 배열
        if (activeTab === "team") setTeamRankings([]);
        else setPlayerRankings([]);
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  // 현재 탭의 데이터를 페이지네이션 적용
  const currentData = activeTab === "team" ? teamRankings : playerRankings;
  const totalPages = Math.max(1, Math.ceil(currentData.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(
    () =>
      currentData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [currentData, currentPage]
  );

  // 탭 정의 — BDR 일반부/대학부 2탭 (기존 team/player 탭은 숨김 처리)
  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "bdr-general", label: "일반부", icon: "leaderboard" },
    { key: "bdr-university", label: "대학부", icon: "school" },
    // 기존 탭은 코드 유지, UI에서만 숨김 (향후 복원 가능)
    // { key: "team", label: "팀 랭킹", icon: "groups" },
    // { key: "player", label: "개인 랭킹", icon: "person" },
  ];

  return (
    <>
      {/* 페이지 헤더: 빨간 세로 막대 + 제목 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-1.5 h-6 rounded-full"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            랭킹
          </h1>
        </div>
        <p
          className="ml-5"
          style={{ color: "var(--color-text-muted)" }}
        >
          BDR 전국 팀 랭킹을 확인하세요.
        </p>
      </div>

      {/* 탭 전환 버튼 */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-bold transition-all"
            style={
              activeTab === tab.key
                ? {
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-on-primary)",
                  }
                : {
                    backgroundColor: "var(--color-elevated)",
                    color: "var(--color-text-secondary)",
                  }
            }
          >
            <span
              className="material-symbols-outlined text-lg"
              style={
                activeTab === tab.key
                  ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
                  : undefined
              }
            >
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* BDR 랭킹 탭 — 자체 컴포넌트가 데이터 로딩/렌더링 담당 */}
      {activeTab === "bdr-general" && (
        <BdrRankingTable division="general" />
      )}
      {activeTab === "bdr-university" && (
        <BdrRankingTable division="university" />
      )}

      {/* 기존 팀/개인 랭킹 테이블 (현재 숨김 상태, 코드 유지) */}
      {(activeTab === "team" || activeTab === "player") && (
        <>
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            {loading ? (
              <TableSkeleton />
            ) : activeTab === "team" ? (
              <TeamRankingTable teams={paginatedData as TeamRanking[]} />
            ) : (
              <PlayerRankingTable players={paginatedData as PlayerRanking[]} />
            )}
          </div>

          {/* 페이지네이션 (기존 팀/개인 탭 전용) */}
          {!loading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </>
      )}
    </>
  );
}
