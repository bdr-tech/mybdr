"use client";

/**
 * 내 프로필 페이지 (/profile)
 *
 * API/데이터 패칭 100% 유지 - UI만 교체
 * - useSWR로 /api/web/profile + /api/web/profile/stats 호출
 * - 레이아웃: 헤더 → PPG/RPG/APG 3칸 → 능력치 분석(2열) + 팀 카드 → 최근 경기
 */

import useSWR from "swr";
import Link from "next/link";
import { ProfileHeader } from "./_components/profile-header";
import { StatBars } from "./_components/stat-bars";
import { AbilitySection } from "./_components/ability-section";
import { CurrentTeamCard } from "./_components/current-team-card";
import { RecentGamesSection } from "./_components/recent-games-section";

// 기존 컴포넌트는 import 제거하되 파일은 삭제하지 않음
// import { ActivityRing } from "./_components/activity-ring";
// import { TeamsSection } from "./_components/teams-section";
// import { TournamentsSection } from "./_components/tournaments-section";
// import { PlayerInfoSection } from "./_components/player-info-section";

interface ProfileData {
  user: {
    nickname: string | null;
    email: string;
    position: string | null;
    height: number | null;
    city: string | null;
    bio: string | null;
    profile_image_url: string | null;
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
}

export default function ProfilePage() {
  // API 호출 로직 100% 유지
  const { data: profile, isLoading } = useSWR<ProfileData>("/api/web/profile", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const { data: statsRaw } = useSWR<StatsData>("/api/web/profile/stats", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // snake_case API 응답 → camelCase 변환 (기존 로직 유지)
  const stats = statsRaw
    ? {
        careerAverages: statsRaw.career_averages
          ? {
              gamesPlayed: statsRaw.career_averages.games_played,
              avgPoints: statsRaw.career_averages.avg_points,
              avgRebounds: statsRaw.career_averages.avg_rebounds,
              avgAssists: statsRaw.career_averages.avg_assists,
              avgSteals: statsRaw.career_averages.avg_steals,
              avgBlocks: statsRaw.career_averages.avg_blocks,
            }
          : null,
        seasonHighs: statsRaw.season_highs
          ? {
              maxPoints: statsRaw.season_highs.max_points,
              maxRebounds: statsRaw.season_highs.max_rebounds,
              maxAssists: statsRaw.season_highs.max_assists,
            }
          : null,
      }
    : undefined;

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" style={{ color: "var(--color-text-secondary)" }}>
        <div className="text-center">
          <div className="mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러/미로그인 상태
  if (!profile || "error" in profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4" style={{ color: "var(--color-text-secondary)" }}>로그인이 필요합니다.</p>
          <Link href="/login" className="rounded px-6 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
            로그인
          </Link>
        </div>
      </div>
    );
  }

  const { user, teams = [], recent_games: recentGames = [] } = profile;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* 1. 프로필 헤더: 아바타 + 이름 + 메타 + 통계 */}
      <ProfileHeader
        nickname={user.nickname}
        email={user.email}
        profileImageUrl={user.profile_image_url}
        position={user.position}
        city={user.city}
        totalGames={user.total_games_participated ?? 0}
      />

      {/* 2. 핵심 스탯 3칸 카드 (PPG / RPG / APG) */}
      <StatBars
        careerAverages={stats?.careerAverages ?? null}
        seasonHighs={stats?.seasonHighs ?? null}
      />

      {/* 3. 2열 레이아웃: 능력치 분석 + 현재 팀 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 좌측 7칸: 능력치 분석 (레이더 차트 + 바 차트) */}
        <div className="lg:col-span-8">
          {stats?.careerAverages ? (
            <AbilitySection
              avgPoints={stats.careerAverages.avgPoints}
              avgRebounds={stats.careerAverages.avgRebounds}
              avgAssists={stats.careerAverages.avgAssists}
              avgSteals={stats.careerAverages.avgSteals}
              avgBlocks={stats.careerAverages.avgBlocks}
            />
          ) : (
            <div
              className="rounded-xl border p-8 text-center"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <span className="material-symbols-outlined text-3xl mb-2" style={{ color: "var(--color-text-muted)" }}>
                analytics
              </span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                경기 기록이 쌓이면 능력치 차트가 표시됩니다
              </p>
            </div>
          )}
        </div>

        {/* 우측 5칸: 현재 팀 카드 */}
        <div className="lg:col-span-4">
          <CurrentTeamCard teams={teams} />
        </div>
      </div>

      {/* 4. 최근 경기 전적 */}
      <RecentGamesSection games={recentGames} />
    </div>
  );
}
