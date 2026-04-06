"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BdrRankingTable } from "./bdr-ranking-table";
import { TossCard } from "@/components/toss/toss-card";
import { TossListItem } from "@/components/toss/toss-list-item";

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

// 탭 종류
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

// 순위 뱃지 색상: 1~3위 특별 표시
function getRankStyle(rank: number): { bg: string; text: string } {
  if (rank === 1) return { bg: "var(--color-primary)", text: "#FFFFFF" };
  if (rank === 2) return { bg: "var(--color-accent)", text: "#FFFFFF" };
  if (rank === 3) return { bg: "var(--color-tertiary)", text: "#FFFFFF" };
  return { bg: "var(--color-surface)", text: "var(--color-text-muted)" };
}

/* ============================================================
 * 스켈레톤 (토스 리스트 스타일)
 * ============================================================ */
function RankingListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-4 px-5">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * 팀 랭킹 리스트 (토스 스타일 TossListItem)
 * ============================================================ */
function TeamRankingList({ teams }: { teams: TeamRanking[] }) {
  if (teams.length === 0) {
    return (
      <div className="py-16 text-center">
        <span
          className="material-symbols-outlined text-5xl mb-3 block"
          style={{ color: "var(--color-text-disabled)" }}
        >
          groups
        </span>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          등록된 팀 랭킹이 없습니다
        </p>
      </div>
    );
  }

  return (
    <TossCard className="p-0">
      {teams.map((team) => {
        const accent = resolveColor(team.primary_color, team.secondary_color);
        const rankStyle = getRankStyle(team.rank);

        return (
          <Link key={team.id} href={`/teams/${team.id}`} className="block">
            <div className="flex items-center gap-3 py-4 px-5 transition-colors hover:bg-[var(--color-surface-bright)] border-b border-[var(--color-border-subtle)] last:border-b-0">
              {/* 순위 원형 뱃지 */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: rankStyle.bg, color: rankStyle.text }}
              >
                {team.rank}
              </div>

              {/* 팀 색상 원 */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: accent }}
              >
                <span className="material-symbols-outlined text-sm text-white">groups</span>
              </div>

              {/* 팀명 + 도시 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {team.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {team.city ?? "지역 미설정"} · 멤버 {team.member_count}명
                </p>
              </div>

              {/* 전적 + 승률 */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                  {team.win_rate}%
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {team.wins}W {team.losses}L
                </p>
              </div>

              {/* 화살표 */}
              <span className="material-symbols-outlined text-lg text-[var(--color-text-disabled)]">
                chevron_right
              </span>
            </div>
          </Link>
        );
      })}
    </TossCard>
  );
}

/* ============================================================
 * 개인 랭킹 리스트 (토스 스타일)
 * ============================================================ */
function PlayerRankingList({ players }: { players: PlayerRanking[] }) {
  if (players.length === 0) {
    return (
      <div className="py-16 text-center">
        <span
          className="material-symbols-outlined text-5xl mb-3 block"
          style={{ color: "var(--color-text-disabled)" }}
        >
          person
        </span>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          등록된 선수 랭킹이 없습니다
        </p>
      </div>
    );
  }

  return (
    <TossCard className="p-0">
      {players.map((player) => {
        const rankStyle = getRankStyle(player.rank);

        return (
          <Link key={player.user_id} href={`/users/${player.user_id}`} className="block">
            <div className="flex items-center gap-3 py-4 px-5 transition-colors hover:bg-[var(--color-surface-bright)] border-b border-[var(--color-border-subtle)] last:border-b-0">
              {/* 순위 원형 뱃지 */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: rankStyle.bg, color: rankStyle.text }}
              >
                {player.rank}
              </div>

              {/* 이니셜 원 */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {player.name?.[0]?.toUpperCase() ?? "?"}
              </div>

              {/* 선수명 + 소속팀 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {player.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {player.team_name} · {player.games_played}경기
                </p>
              </div>

              {/* 점수 */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                  {player.avg_points} PPG
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  총 {player.total_points}점
                </p>
              </div>

              <span className="material-symbols-outlined text-lg text-[var(--color-text-disabled)]">
                chevron_right
              </span>
            </div>
          </Link>
        );
      })}
    </TossCard>
  );
}

/* ============================================================
 * 페이지네이션 (토스 스타일)
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
        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={`dots-${idx}`} className="px-2" style={{ color: "var(--color-text-disabled)" }}>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-10 h-10 flex items-center justify-center rounded-md font-bold text-sm transition-colors"
            style={
              page === currentPage
                ? { backgroundColor: "var(--color-primary)", color: "#FFFFFF" }
                : { backgroundColor: "var(--color-surface)", color: "var(--color-text-secondary)" }
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
        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

/* ============================================================
 * 메인 컴포넌트: RankingsContent (토스 스타일)
 *
 * 변경: 테이블 -> TossListItem 리스트 (순위 원형 뱃지 + 팀명/점수)
 * 탭: 토스 스타일 pill 탭
 * API 로직은 100% 동일 유지
 * ============================================================ */
export function RankingsContent() {
  const [activeTab, setActiveTab] = useState<TabType>("bdr-general");
  const [teamRankings, setTeamRankings] = useState<TeamRanking[]>([]);
  const [playerRankings, setPlayerRankings] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // 탭이 바뀌면 해당 데이터를 API에서 가져옴
  useEffect(() => {
    if (activeTab.startsWith("bdr-")) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setCurrentPage(1);

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
        if (activeTab === "team") setTeamRankings([]);
        else setPlayerRankings([]);
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  // 페이지네이션 계산
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

  // 탭 정의: BDR 일반부/대학부
  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "bdr-general", label: "일반부", icon: "leaderboard" },
    { key: "bdr-university", label: "대학부", icon: "school" },
  ];

  return (
    /* 토스 스타일: 1열 세로 스택, 최대 640px */
    <div className="max-w-[640px] mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          랭킹
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          BDR 전국 팀 랭킹을 확인하세요
        </p>
      </div>

      {/* 탭: 토스 스타일 pill 버튼 */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all"
            style={
              activeTab === tab.key
                ? {
                    backgroundColor: "var(--color-primary)",
                    color: "#FFFFFF",
                  }
                : {
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-muted)",
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

      {/* BDR 랭킹 탭: 자체 컴포넌트가 데이터 로딩/렌더링 담당 */}
      {activeTab === "bdr-general" && (
        <BdrRankingTable division="general" />
      )}
      {activeTab === "bdr-university" && (
        <BdrRankingTable division="university" />
      )}

      {/* 기존 팀/개인 랭킹 리스트 (현재 숨김 상태, 코드 유지) */}
      {(activeTab === "team" || activeTab === "player") && (
        <>
          {loading ? (
            <RankingListSkeleton />
          ) : activeTab === "team" ? (
            <TeamRankingList teams={paginatedData as TeamRanking[]} />
          ) : (
            <PlayerRankingList players={paginatedData as PlayerRanking[]} />
          )}

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
    </div>
  );
}
