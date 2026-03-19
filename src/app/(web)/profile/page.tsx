"use client";

import useSWR from "swr";
import Link from "next/link";
import { ProfileHeader } from "./_components/profile-header";
import { ActivityRing } from "./_components/activity-ring";
import { StatBars } from "./_components/stat-bars";
import { RecentGamesSection } from "./_components/recent-games-section";
import { TeamsSection } from "./_components/teams-section";
import { TournamentsSection } from "./_components/tournaments-section";
import { PlayerInfoSection } from "./_components/player-info-section";

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
  const { data: profile, isLoading } = useSWR<ProfileData>("/api/web/profile", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const { data: statsRaw } = useSWR<StatsData>("/api/web/profile/stats", {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // snake_case API 응답 → camelCase 변환
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
        // snake_case → camelCase 변환 (StatBars 컴포넌트가 camelCase를 기대)
        seasonHighs: statsRaw.season_highs
          ? {
              maxPoints: statsRaw.season_highs.max_points,
              maxRebounds: statsRaw.season_highs.max_rebounds,
              maxAssists: statsRaw.season_highs.max_assists,
            }
          : null,
      }
    : undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#6B7280]">
        <div className="text-center">
          <div className="mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 animate-spin text-[#1B3C87]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!profile || "error" in profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-[#6B7280]">로그인이 필요합니다.</p>
          <Link href="/login" className="rounded-[10px] bg-[#1B3C87] px-6 py-2 text-sm font-semibold text-white">
            로그인
          </Link>
        </div>
      </div>
    );
  }

  const { user, teams = [], recent_games: recentGames = [], tournaments = [] } = profile;

  return (
    <div className="space-y-4">
      <ProfileHeader
        nickname={user.nickname}
        email={user.email}
        profileImageUrl={user.profile_image_url}
      />

      <ActivityRing
        monthlyGames={statsRaw?.monthly_games ?? 0}
        totalGames={user.total_games_participated ?? 0}
        totalTournaments={tournaments.length}
      />

      <StatBars
        careerAverages={stats?.careerAverages ?? null}
        seasonHighs={stats?.seasonHighs ?? null}
      />

      <RecentGamesSection games={recentGames} />
      <TeamsSection teams={teams} />
      <TournamentsSection tournaments={tournaments} />

      <PlayerInfoSection
        position={user.position}
        height={user.height}
        city={user.city}
        bio={user.bio}
      />
    </div>
  );
}
