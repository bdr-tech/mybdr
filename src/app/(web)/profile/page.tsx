/* ============================================================
 * /profile — v2 본인 프로필 대시보드 (서버 컴포넌트)
 *
 * 왜 서버 컴포넌트로 전환:
 * - PM 지시: "서버 컴포넌트에서 Prisma 직접 호출 OK" (D-P2 timeline, D-P8 badges).
 * - 기존 "use client" + useSWR 3개(profile/gamification/stats) 구조는 API 라운드트립 +
 *   snake_case 변환을 거쳐야 해서 profile 응답 select 에 빠진 필드
 *   (gender / evaluation_rating / total_games_hosted) 를 가져오려면 API 수정이 필요.
 *   PM 규칙 "API/route.ts/Prisma 스키마 0 변경" → 페이지에서 Prisma 직접 호출이 유일한 해법.
 *
 * 어떻게:
 * - getWebSession 으로 세션 확보 → 비로그인은 로그인 유도 UI.
 * - Promise.all 로 7 쿼리 병렬 prefetch:
 *   1) user (필요 필드 전부 — bio, gender, evaluation_rating, total_games_hosted, xp 등)
 *   2) 소속 팀 (TeamMember + team 요약)
 *   3) 다음 경기 (game_applications + games scheduled_at > now)
 *   4) 승률/평균 (getPlayerStats)
 *   5) 알림 미확인 수 (notifications.count)
 *   6) 활동 타임라인 — community_posts 최근 5건
 *   7) 활동 타임라인 — game_applications 최근 5건
 *   8) user_badges 최신 4건
 * - 6+7은 클라이언트에서 merge + sort 후 상위 5건만 표시.
 *
 * 보안/규칙:
 * - 세션 userId 기반 본인 데이터만 조회 (IDOR 없음).
 * - BigInt → string 변환, Date → ISO 변환 모두 여기서 처리.
 * - Prisma 직접 호출이지만 서비스 레이어(getPlayerStats, getProfileLevelInfo) 재사용으로 중복 축소.
 * ============================================================ */

import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { getPlayerStats } from "@/lib/services/user";
import { getProfileLevelInfo } from "@/lib/profile/gamification";

import { HeroCard } from "./_v2/hero-card";
import { SeasonStats } from "./_v2/season-stats";
import { UpcomingGames } from "./_v2/upcoming-games";
import { ActivityTimeline, type ActivityItem } from "./_v2/activity-timeline";
import { TeamSideCard } from "./_v2/team-side-card";
import { BadgesSideCard } from "./_v2/badges-side-card";

// SSR 세션 기반 페이지 — 캐시 금지 (본인 데이터는 매 요청 최신)
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getWebSession();

  // 비로그인 → 로그인 유도 (기존 UX 유지)
  if (!session) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "var(--ink-dim)", marginBottom: 16, display: "block" }}
          >
            person_off
          </span>
          <p style={{ marginBottom: 16, fontSize: 14, color: "var(--ink-mute)" }}>
            로그인이 필요합니다
          </p>
          <Link href="/login" className="btn btn--accent" style={{ display: "inline-block" }}>
            로그인
          </Link>
        </div>
      </div>
    );
  }

  const userId = BigInt(session.sub);
  const now = new Date();

  // ---- 병렬 prefetch (8 쿼리) ----
  const [
    user,
    teamMembers,
    nextGameApp,
    playerStats,
    unreadCount,
    recentPosts,
    recentApplications,
    userBadges,
  ] = await Promise.all([
    // 1) user 필수 필드 — profile API 보다 확장(gender/evaluation_rating/total_games_hosted/xp/subscription)
    prisma.user
      .findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          nickname: true,
          profile_image_url: true,
          position: true,
          city: true,
          district: true,
          height: true,
          weight: true,
          bio: true,
          gender: true,
          evaluation_rating: true,
          total_games_hosted: true,
          xp: true,
          subscription_status: true,
          profile_completed: true,
        },
      })
      .catch(() => null),

    // 2) 소속 팀 (active만)
    prisma.teamMember
      .findMany({
        where: { userId, status: "active" },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              primaryColor: true,
              logoUrl: true,
            },
          },
        },
        orderBy: { joined_at: "desc" },
        take: 5,
      })
      .catch(() => []),

    // 3) 다음 경기 — scheduled_at > now 인 가장 빠른 1건
    prisma.game_applications
      .findFirst({
        where: {
          user_id: userId,
          games: { scheduled_at: { gt: now } },
        },
        include: {
          games: {
            select: {
              id: true,
              uuid: true,
              title: true,
              scheduled_at: true,
              venue_name: true,
            },
          },
        },
        orderBy: { games: { scheduled_at: "asc" } },
      })
      .catch(() => null),

    // 4) 승률 / 평균 스탯
    getPlayerStats(userId).catch(() => null),

    // 5) 알림 미확인 수 — 실패 시 0. status="unread" 로 구분 (schema 상 read 여부 필드)
    prisma.notifications
      .count({ where: { user_id: userId, status: "unread" } })
      .catch(() => 0),

    // 6) community_posts 최근 5건 (활동 타임라인용)
    prisma.community_posts
      .findMany({
        where: { user_id: userId, status: "published" },
        select: {
          id: true,
          public_id: true,
          title: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
        take: 5,
      })
      .catch(() => []),

    // 7) game_applications 최근 5건 (활동 타임라인용)
    prisma.game_applications
      .findMany({
        where: { user_id: userId },
        select: {
          id: true,
          created_at: true,
          games: {
            select: {
              id: true,
              uuid: true,
              title: true,
              scheduled_at: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 5,
      })
      .catch(() => []),

    // 8) user_badges 최신 4건
    prisma.user_badges
      .findMany({
        where: { user_id: userId },
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

  if (!user) {
    // 세션은 있으나 DB 조회 실패 — 드문 엣지
    return (
      <div style={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--ink-mute)" }}>프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  // ---- Hero 데이터 변환 ----
  const level = getProfileLevelInfo(user.xp);
  // subscription_status === "active" 이면 PRO
  const isPro = user.subscription_status === "active";
  const isVerified = !!user.profile_completed;
  // evaluation_rating 은 Decimal → number
  const evaluationRating = user.evaluation_rating != null ? Number(user.evaluation_rating) : null;

  const primaryTeam = teamMembers[0]?.team
    ? {
        id: teamMembers[0].team.id.toString(),
        name: teamMembers[0].team.name,
        primaryColor: teamMembers[0].team.primaryColor,
        logoUrl: teamMembers[0].team.logoUrl,
      }
    : null;

  // ---- SeasonStats 데이터 변환 ----
  const career = playerStats?.careerAverages ?? null;
  const seasonStatsData = {
    games: career?.gamesPlayed ?? 0,
    winRate: playerStats?.winRate ?? null,
    ppg: career?.avgPoints ?? null,
    apg: career?.avgAssists ?? null,
    rpg: career?.avgRebounds ?? null,
    rating: evaluationRating,
  };

  // ---- UpcomingGames 데이터 변환 ----
  const nextGame = nextGameApp?.games
    ? {
        id: nextGameApp.games.uuid ?? nextGameApp.game_id.toString(),
        title: nextGameApp.games.title ?? null,
        scheduledAt: nextGameApp.games.scheduled_at?.toISOString() ?? null,
        venueName: nextGameApp.games.venue_name ?? null,
      }
    : null;

  // ---- Activity 타임라인 merge (posts + applications → created_at desc 상위 5건) ----
  const postItems: ActivityItem[] = recentPosts.map((p) => ({
    key: `post-${p.id.toString()}`,
    createdAt: p.created_at.toISOString(),
    kind: "post" as const,
    action: "게시글 작성",
    target: p.title ?? "제목 없음",
    // 글 상세 링크 — public_id uuid 기반
    href: `/community/${p.public_id}`,
  }));
  const appItems: ActivityItem[] = recentApplications.map((a) => ({
    key: `app-${a.id.toString()}`,
    createdAt: a.created_at.toISOString(),
    kind: "application" as const,
    action: "경기 신청",
    target: a.games?.title ?? "경기",
    // game 상세 링크 — uuid 우선, slice 8자 (기존 패턴)
    href: a.games?.uuid
      ? `/games/${a.games.uuid.slice(0, 8)}`
      : undefined,
  }));
  // 날짜 desc 정렬 후 상위 5개
  const activities = [...postItems, ...appItems]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // ---- Badges 변환 ----
  const badges = userBadges.map((b) => ({
    id: b.id.toString(),
    badgeType: b.badge_type,
    badgeName: b.badge_name,
    earnedAt: b.earned_at.toISOString(),
  }));

  return (
    <div className="page">
      {/* 레이아웃: 좌측 320px aside (sticky) + 우측 main 1fr — v2 Profile.jsx 그대로 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {/* ========== 좌측 aside ========== */}
        <aside
          style={{
            position: "sticky",
            top: 120,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <HeroCard
            user={{
              nickname: user.nickname,
              name: user.name,
              profile_image_url: user.profile_image_url,
              position: user.position,
              city: user.city,
              district: user.district,
              bio: user.bio,
              gender: user.gender,
              total_games_hosted: user.total_games_hosted,
              evaluation_rating: evaluationRating,
            }}
            level={level}
            isPro={isPro}
            isVerified={isVerified}
            team={primaryTeam ? { teamName: primaryTeam.name } : null}
            unreadCount={unreadCount}
          />

          {/* 소속 팀 — 1팀 이상일 때만 */}
          {primaryTeam && (
            <TeamSideCard primaryTeam={primaryTeam} totalTeams={teamMembers.length} />
          )}

          {/* 뱃지 — 1개 이상일 때만 */}
          {badges.length > 0 && <BadgesSideCard badges={badges} />}
        </aside>

        {/* ========== 우측 main ========== */}
        <div>
          <SeasonStats data={seasonStatsData} seasonLabel="통산" />
          <UpcomingGames game={nextGame} />
          <ActivityTimeline items={activities} />
        </div>
      </div>
    </div>
  );
}
