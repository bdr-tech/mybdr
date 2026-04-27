import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { getPlayerStats } from "@/lib/services/user";
import { getProfileLevelInfo } from "@/lib/profile/gamification";

import { PlayerHero } from "./_v2/player-hero";
import { ProfileTabs } from "./_v2/profile-tabs";
import { OverviewTab } from "./_v2/overview-tab";
import { RecentGamesTab } from "./_v2/recent-games-tab";
import { ActionButtons } from "./_components/action-buttons";

/**
 * 타인 프로필 페이지 (/users/[id]) — v2 재구성 (서버 컴포넌트)
 *
 * 왜 이렇게 작성하나 (PM 확정 D-P1~D-P8 반영):
 * - D-P5: 탭 2개만 (개요 + 최근 경기). 시즌별 평균/vs 전적 탭 제거.
 * - D-P6: 슛존/스카우팅 섹션 제거 → overview 탭은 시즌 스탯 + aside(팀·활동·뱃지).
 * - D-P7: isOwner 면 /profile 로 redirect (본인 진입 시 대시보드 유도).
 * - D-P8: user_badges 쿼리 추가 (읽기만, 서버 컴포넌트 Prisma 직접 호출).
 * - 누락 필드 4개 (bio/gender/evaluation_rating/total_games_hosted) 전부 화면 표시.
 *
 * 어떻게:
 * - Promise.all 병렬 prefetch (8 쿼리) — user+team join / stat aggregate / recent games /
 *   playerStats / follow record / follower/following counts / user_badges.
 * - 클라이언트 탭 스위처(ProfileTabs) 는 overview·games 노드를 prop 으로 받음.
 * - 그라디언트 배경은 소속팀 primaryColor (없으면 var(--bdr-red)) 기반.
 */

// 60초 ISR 유지
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user
    .findUnique({
      where: { id: BigInt(id) },
      select: { nickname: true, position: true },
    })
    .catch(() => null);
  if (!user) return { title: "선수 프로필 | MyBDR" };
  return {
    title: `${user.nickname || "선수"} 프로필 | MyBDR`,
    description: `${user.nickname || "선수"}의 경기 기록과 능력치를 확인하세요.`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userIdBigInt = BigInt(id);

  // 세션 먼저 체크 — 본인이면 /profile redirect (D-P7)
  const session = await getWebSession();
  const isLoggedIn = !!session;
  const isOwner = !!session && BigInt(session.sub) === userIdBigInt;
  if (isOwner) {
    redirect("/profile");
  }

  // ---- 병렬 prefetch (8 쿼리) ----
  const [
    user,
    statAgg,
    recentGames,
    playerStats,
    followRecord,
    followersCount,
    followingCount,
    userBadges,
  ] = await Promise.all([
    // 1) user + 소속 팀 (is_public / active 공개 팀만 이후 필터)
    prisma.user
      .findUnique({
        where: { id: userIdBigInt },
        select: {
          id: true,
          name: true,
          nickname: true,
          position: true,
          height: true,
          weight: true,
          city: true,
          district: true,
          bio: true,
          gender: true,
          evaluation_rating: true,
          total_games_hosted: true,
          total_games_participated: true,
          profile_image_url: true,
          xp: true,
          createdAt: true,
          last_login_at: true,
          teamMembers: {
            where: { status: "active" },
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  city: true,
                  district: true,
                  is_public: true,
                  status: true,
                  primaryColor: true,
                },
              },
            },
            orderBy: { joined_at: "desc" },
          },
        },
      })
      .catch(() => null),

    // 2) 경기 집계 (PPG/APG/RPG/STL/BPG 평균) - Phase 3 공식 기록만
    prisma.matchPlayerStat
      .aggregate({
        where: {
          tournamentTeamPlayer: { userId: userIdBigInt },
        },
        _avg: {
          points: true,
          total_rebounds: true,
          assists: true,
          steals: true,
          blocks: true,
        },
        _count: { id: true },
      })
      .catch(() => null),

    // 3) 최근 경기 10건 (recent games 탭용)
    prisma.matchPlayerStat
      .findMany({
        where: {
          tournamentTeamPlayer: { userId: userIdBigInt },
        },
        select: {
          id: true,
          points: true,
          total_rebounds: true,
          assists: true,
          steals: true,
          tournamentMatch: {
            select: {
              roundName: true,
              scheduledAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      .catch(() => []),

    // 4) 승률 계산
    getPlayerStats(userIdBigInt).catch(() => null),

    // 5) 팔로우 여부 (로그인 상태일 때만)
    session
      ? prisma.follows
          .findUnique({
            where: {
              follower_id_following_id: {
                follower_id: BigInt(session.sub),
                following_id: userIdBigInt,
              },
            },
          })
          .catch(() => null)
      : Promise.resolve(null),

    // 6) 팔로워 수
    prisma.follows
      .count({ where: { following_id: userIdBigInt } })
      .catch(() => 0),

    // 7) 팔로잉 수
    prisma.follows
      .count({ where: { follower_id: userIdBigInt } })
      .catch(() => 0),

    // 8) user_badges (D-P8) — 최신 4건
    prisma.user_badges
      .findMany({
        where: { user_id: userIdBigInt },
        select: {
          id: true,
          badge_type: true,
          badge_name: true,
          earned_at: true,
        },
        orderBy: { earned_at: "desc" },
        take: 4,
      })
      .catch(() => []),
  ]);

  if (!user) return notFound();

  const isFollowing = !!followRecord;

  // ---- 레벨 ----
  const level = getProfileLevelInfo(user.xp);

  // ---- 공개 팀 필터 (기존 로직 유지) ----
  const publicTeams = user.teamMembers
    .filter((tm) => {
      const t = tm.team;
      if (!t) return false;
      if (t.status !== "active") return false;
      if (t.is_public === false) return false;
      return true;
    })
    .map((tm) => ({
      id: tm.team.id.toString(),
      name: tm.team.name,
      primaryColor: tm.team.primaryColor,
      logoUrl: tm.team.logoUrl,
    }));

  // 대표 팀 (Hero 그라디언트 / 이름)
  const primaryTeam = publicTeams[0] ?? null;

  // ---- 시즌 스탯 (OverviewTab 6열) ----
  const gamesPlayed = statAgg?._count?.id ?? 0;
  const seasonStats = {
    games: gamesPlayed,
    winRate: playerStats?.winRate ?? null,
    ppg: gamesPlayed > 0 ? Number((statAgg?._avg?.points ?? 0).toFixed(1)) : null,
    apg: gamesPlayed > 0 ? Number((statAgg?._avg?.assists ?? 0).toFixed(1)) : null,
    rpg: gamesPlayed > 0 ? Number((statAgg?._avg?.total_rebounds ?? 0).toFixed(1)) : null,
    bpg: gamesPlayed > 0 ? Number((statAgg?._avg?.blocks ?? 0).toFixed(1)) : null,
  };

  // ---- 최근 경기 변환 ----
  const recentGameRows = recentGames.map((g) => ({
    id: g.id.toString(),
    scheduledAt: g.tournamentMatch?.scheduledAt?.toISOString() ?? null,
    gameTitle: g.tournamentMatch?.roundName ?? null,
    points: g.points ?? 0,
    rebounds: g.total_rebounds ?? 0,
    assists: g.assists ?? 0,
    steals: g.steals ?? 0,
  }));

  // ---- 뱃지 변환 ----
  const badges = userBadges.map((b) => ({
    id: b.id.toString(),
    badgeType: b.badge_type,
    badgeName: b.badge_name,
    earnedAt: b.earned_at.toISOString(),
  }));

  // ---- 활동 요약 (overview aside) ----
  const activity = {
    joinedAt: user.createdAt?.toISOString() ?? null,
    gamesPlayed: user.total_games_participated ?? 0,
    gamesHosted: user.total_games_hosted ?? 0,
    lastSeen: null as string | null,
    // lastLoginAt 은 Hero 의 "최근 접속" 에 사용하므로 여기는 null 로 두고 relative 문자열만 Hero 가 계산
  };

  // ---- Hero / 평점 ----
  const evaluationRating = user.evaluation_rating != null ? Number(user.evaluation_rating) : null;

  // followersCount/followingCount 는 현재 UI 에 노출하지 않지만 반환된 값은 차후 확장용
  void followersCount;
  void followingCount;

  return (
    <div className="page">
      <PlayerHero
        user={{
          nickname: user.nickname,
          name: user.name,
          profile_image_url: user.profile_image_url,
          position: user.position,
          height: user.height,
          weight: user.weight,
          city: user.city,
          district: user.district,
          bio: user.bio,
          gender: user.gender,
          evaluation_rating: evaluationRating,
          createdAt: user.createdAt?.toISOString() ?? null,
          lastLoginAt: user.last_login_at?.toISOString() ?? null,
        }}
        level={level}
        teamColor={primaryTeam?.primaryColor ?? null}
        teamName={primaryTeam?.name ?? null}
        actionSlot={
          // 로그인 상태면 팔로우/메시지, 비로그인이면 안내 없음 (기본 렌더 없음)
          <ActionButtons
            targetUserId={id}
            initialFollowed={isFollowing}
            isLoggedIn={isLoggedIn}
          />
        }
      />

      <ProfileTabs
        overview={
          <OverviewTab
            stats={seasonStats}
            teams={publicTeams}
            badges={badges}
            activity={activity}
          />
        }
        games={<RecentGamesTab games={recentGameRows} />}
      />
    </div>
  );
}
