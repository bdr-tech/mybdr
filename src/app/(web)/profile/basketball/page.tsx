"use client";

/**
 * 내 농구 페이지 (/profile/basketball)
 *
 * 기존 /profile 페이지에서 팀/경기/대회/통계 섹션을 분리한 페이지.
 * API/데이터 패칭은 기존 프로필과 동일한 엔드포인트 사용.
 */

import useSWR from "swr";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";
import { TossListItem } from "@/components/toss/toss-list-item";
import { TossSectionHeader } from "@/components/toss/toss-section-header";

// 기존 프로필 API 타입 재사용
interface ProfileData {
  user: {
    nickname: string | null;
    total_games_participated: number | null;
  };
  teams?: { id: string; name: string; role: string }[];
  recent_games?: { id: string; title: string | null; scheduled_at: string | null; status: number }[];
  tournaments?: { id: string; name: string; status: string | null }[];
}

interface StatsData {
  career_averages: {
    games_played: number;
    avg_points: number;
    avg_rebounds: number;
    avg_assists: number;
    avg_steals: number;
    avg_blocks: number;
  } | null;
  season_highs: {
    max_points: number;
    max_rebounds: number;
    max_assists: number;
  } | null;
  monthly_games: number;
  win_rate: number | null;
}

// 경기 상태 라벨 매핑
function getGameStatus(status: number): string {
  switch (status) {
    case 0: return "예정";
    case 1: return "진행중";
    case 2: return "종료";
    default: return "예정";
  }
}

export default function BasketballPage() {
  // 기존 프로필 API 엔드포인트 그대로 호출
  const { data: profile, isLoading } = useSWR<ProfileData>("/api/web/profile", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const { data: statsRaw } = useSWR<StatsData>("/api/web/profile/stats", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 비로그인 or 에러
  if (!profile || "error" in profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: "var(--color-text-disabled)" }}>person_off</span>
          <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>로그인이 필요합니다</p>
          <Link href="/login" className="inline-block rounded-md px-8 py-3 text-sm font-bold text-white" style={{ backgroundColor: "var(--color-primary)" }}>로그인</Link>
        </div>
      </div>
    );
  }

  const { teams = [], recent_games: recentGames = [], tournaments = [] } = profile;
  const totalGames = profile.user.total_games_participated ?? 0;
  const winRate = statsRaw?.win_rate;
  const avgPoints = statsRaw?.career_averages?.avg_points ?? 0;
  const avgRebounds = statsRaw?.career_averages?.avg_rebounds ?? 0;
  const avgAssists = statsRaw?.career_averages?.avg_assists ?? 0;

  return (
    <div className="max-w-[640px] mx-auto space-y-8">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3 pt-2">
        <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface)]">
          <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-text-secondary)" }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>내 농구</h1>
      </div>

      {/* 핵심 통계: 3열 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        <TossCard className="text-center">
          <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>{totalGames}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>총 경기</p>
        </TossCard>
        <TossCard className="text-center">
          <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-primary)" }}>{winRate != null ? `${winRate}%` : "-"}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>승률</p>
        </TossCard>
        <TossCard className="text-center">
          <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>{avgPoints > 0 ? avgPoints.toFixed(1) : "-"}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>PPG</p>
        </TossCard>
      </div>

      {/* 커리어 평균 상세 */}
      {statsRaw?.career_averages && (
        <TossCard>
          <TossSectionHeader title="커리어 평균" />
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{avgRebounds.toFixed(1)}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>RPG</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{avgAssists.toFixed(1)}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>APG</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{(statsRaw.career_averages.avg_steals ?? 0).toFixed(1)}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>SPG</p>
            </div>
          </div>
        </TossCard>
      )}

      {/* 소속 팀 */}
      <div>
        <TossSectionHeader title="소속 팀" actionLabel="전체보기" actionHref="/teams" />
        <TossCard className="p-0">
          {teams.length > 0 ? (
            teams.map((team) => (
              <TossListItem
                key={team.id}
                icon="groups"
                iconBg="var(--color-primary)"
                title={team.name}
                subtitle={team.role === "owner" ? "팀장" : "팀원"}
                href={`/teams/${team.id}`}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: "var(--color-text-disabled)" }}>group_add</span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>소속 팀이 없어요</p>
              <Link href="/teams" className="inline-block mt-2 text-xs font-bold" style={{ color: "var(--color-primary)" }}>팀 찾아보기</Link>
            </div>
          )}
        </TossCard>
      </div>

      {/* 최근 경기 */}
      <div>
        <TossSectionHeader title="최근 경기" actionLabel="전체보기" actionHref="/games" />
        <TossCard className="p-0">
          {recentGames.length > 0 ? (
            recentGames.slice(0, 5).map((game) => (
              <TossListItem
                key={game.id}
                icon="sports_basketball"
                iconBg="var(--color-accent)"
                title={game.title ?? "경기"}
                subtitle={game.scheduled_at ? new Date(game.scheduled_at).toLocaleDateString("ko-KR") : "일정 미정"}
                rightText={getGameStatus(game.status)}
                href={`/games/${game.id}`}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: "var(--color-text-disabled)" }}>sports_basketball</span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>아직 경기 기록이 없어요</p>
              <Link href="/games" className="mt-3 inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-light)]">
                <span className="material-symbols-outlined text-base">search</span>
                경기 찾아보기
              </Link>
            </div>
          )}
        </TossCard>
      </div>

      {/* 참가 대회 */}
      <div>
        <TossSectionHeader title="참가 대회" actionLabel="전체보기" actionHref="/tournaments" />
        <TossCard className="p-0">
          {tournaments.length > 0 ? (
            tournaments.slice(0, 5).map((t) => (
              <TossListItem
                key={t.id}
                icon="emoji_events"
                iconBg="var(--color-tier-gold)"
                title={t.name}
                subtitle={t.status ?? ""}
                href={`/tournaments/${t.id}`}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: "var(--color-text-disabled)" }}>emoji_events</span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>참가한 대회가 없어요</p>
              <Link href="/tournaments" className="inline-block mt-2 text-xs font-bold" style={{ color: "var(--color-primary)" }}>대회 찾아보기</Link>
            </div>
          )}
        </TossCard>
      </div>

      {/* 주간 리포트 링크 */}
      <TossCard className="p-0">
        <TossListItem
          icon="bar_chart"
          iconBg="var(--color-info, #0079B9)"
          title="주간 운동 리포트"
          subtitle="이번주 운동 요약과 지난주 비교"
          href="/profile/weekly-report"
        />
      </TossCard>
    </div>
  );
}
