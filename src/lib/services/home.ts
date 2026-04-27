/**
 * 홈페이지 서버 프리페치용 서비스 함수
 *
 * 왜 이 파일이 필요한가:
 * page.tsx(서버 컴포넌트)에서 DB를 직접 조회하여 클라이언트 컴포넌트에
 * fallbackData로 전달하면, 초기 로딩 없이 즉시 화면을 그릴 수 있다.
 * (식당 오픈 전 인기 메뉴를 미리 만들어 놓는 것과 같은 원리)
 *
 * 각 함수는 API route와 동일한 Prisma 쿼리를 실행하고,
 * apiSuccess()가 하는 것과 동일한 snake_case 변환을 적용한다.
 * 이렇게 해야 useSWR의 fallbackData와 실제 API 응답의 형식이 일치한다.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { convertKeysToSnakeCase } from "@/lib/utils/case";

/* ============================================================
 * 1. 팀 목록 프리페치
 * - /api/web/teams API와 동일한 쿼리 + 직렬화
 * - 검색/필터 없이 기본 목록만 (홈 프리페치용)
 * ============================================================ */
// unstable_cache로 감싸서 60초간 DB 결과를 재사용
// 홈페이지는 접속 빈도가 높으므로, 동일 데이터를 매번 DB에서 가져오지 않도록 캐시
export const prefetchTeams = unstable_cache(async () => {
  const [teams, citiesRaw] = await Promise.all([
    prisma.team.findMany({
      where: { status: "active", is_public: true },
      orderBy: [{ wins: "desc" }, { createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        city: true,
        district: true,
        wins: true,
        losses: true,
        accepting_members: true,
        tournaments_count: true,
        _count: { select: { teamMembers: true } },
      },
    }),
    prisma.team.groupBy({
      by: ["city"],
      where: { city: { not: null }, status: "active", is_public: true },
      orderBy: { _count: { city: "desc" } },
      take: 30,
    }),
  ]);

  const cities = citiesRaw.map((r) => r.city!).filter(Boolean);

  // BigInt -> string 변환 + 필드 평탄화 (API route와 동일)
  const serializedTeams = teams.map((t) => ({
    id: t.id.toString(),
    name: t.name,
    primaryColor: t.primaryColor,
    secondaryColor: t.secondaryColor,
    city: t.city,
    district: t.district,
    wins: t.wins,
    losses: t.losses,
    acceptingMembers: t.accepting_members,
    tournamentsCount: t.tournaments_count,
    memberCount: t._count.teamMembers,
  }));

  // apiSuccess()와 동일하게 snake_case 변환하여 반환
  return convertKeysToSnakeCase({ teams: serializedTeams, cities }) as {
    teams: Array<{
      id: string;
      name: string;
      primary_color: string | null;
      secondary_color: string | null;
      city: string | null;
      district: string | null;
      wins: number;
      losses: number;
      accepting_members: boolean;
      tournaments_count: number;
      member_count: number;
    }>;
    cities: string[];
  };
}, ["home-teams"], { revalidate: 60 });

/* ============================================================
 * 2. 플랫폼 통계 프리페치
 * - /api/web/stats API와 동일한 3개 COUNT 쿼리
 * ============================================================ */
export const prefetchStats = unstable_cache(async () => {
  const [teamCount, matchCount, userCount] = await Promise.all([
    prisma.team.count({ where: { status: "active", is_public: true } }),
    prisma.games.count(),
    prisma.user.count(),
  ]);

  // apiSuccess()와 동일하게 snake_case 변환
  return convertKeysToSnakeCase({ teamCount, matchCount, userCount }) as {
    team_count: number;
    match_count: number;
    user_count: number;
  };
}, ["home-stats"], { revalidate: 60 });

/* ============================================================
 * 3. 커뮤니티 게시글 프리페치
 * - /api/web/community API와 동일한 쿼리 (필터 없이 기본 목록)
 * - 홈 프리페치용이므로 prefer/category/q 파라미터 없음
 * ============================================================ */
export const prefetchCommunity = unstable_cache(async () => {
  // content 전체를 가져오지 않고 필요한 컬럼만 select (수천자 본문 → DB 레벨에서 제외)
  const posts = await prisma.community_posts.findMany({
    where: {},
    orderBy: { created_at: "desc" },
    take: 30,
    select: {
      id: true,
      public_id: true,
      title: true,
      category: true,
      view_count: true,
      comments_count: true,
      likes_count: true,
      created_at: true,
      users: {
        select: {
          nickname: true,
          profile_image_url: true,
        },
      },
    },
  });

  // BigInt/Date 직렬화 (content 필드 제외 — 목록에서는 미리보기 불필요)
  const serializedPosts = posts.map((p) => ({
    id: p.id.toString(),
    publicId: p.public_id,
    title: p.title,
    category: p.category,
    viewCount: p.view_count ?? 0,
    commentsCount: p.comments_count ?? 0,
    likesCount: p.likes_count ?? 0,
    createdAt: p.created_at?.toISOString() ?? null,
    authorNickname: p.users?.nickname ?? "익명",
    authorProfileImage: p.users?.profile_image_url ?? null,
    contentPreview: "",
  }));

  // apiSuccess()와 동일하게 snake_case 변환
  return convertKeysToSnakeCase({
    posts: serializedPosts,
    preferred_categories: [],
  }) as {
    posts: Array<{
      id: string;
      public_id: string | null;
      title: string;
      category: string | null;
      view_count: number;
      comments_count: number;
      likes_count: number;
      created_at: string | null;
      author_nickname: string;
      author_profile_image: string | null;
      content_preview: string;
    }>;
    preferred_categories: string[];
  };
}, ["home-community"], { revalidate: 60 });

/* ============================================================
 * 4. 추천 경기 프리페치
 * - /api/web/recommended-games API와 동일한 쿼리
 * - 로그인/비로그인 분기: session이 있으면 개인화, 없으면 최신 경기
 * - unstable_cache: sessionSub를 캐시 키에 포함하여 유저별 캐시 분리
 * ============================================================ */
export async function prefetchRecommendedGames(sessionSub?: string) {
  // 비로그인: 최신 경기 6개
  if (!sessionSub) {
    const games = await getLatestGamesForPrefetch();
    return convertKeysToSnakeCase({ userName: null, games }) as PrefetchGamesResult;
  }

  // 로그인: 개인화 추천
  const userId = BigInt(sessionSub);

  const [user, pastApplications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true, name: true, city: true, district: true },
    }).catch(() => null),
    prisma.game_applications.findMany({
      where: { user_id: userId, status: { in: [1, 2] } },
      orderBy: { created_at: "desc" },
      take: 20,
      include: {
        games: {
          select: { game_type: true, city: true, skill_level: true },
        },
      },
    }).catch(() => []),
  ]);

  const userName = user?.nickname || user?.name || null;

  // 프로필 지역 파싱
  const profileCities = user?.city
    ? user.city.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const hasHistory = pastApplications.length >= 3;

  // 이력 부족 시 지역 기반 추천
  if (!hasHistory) {
    const games = await getLatestGamesForPrefetch(
      profileCities.length > 0 ? profileCities : undefined
    );
    const gamesWithReason = games.map((g) => ({
      ...g,
      matchReason: g.city && profileCities.includes(g.city)
        ? ["내 지역 경기"]
        : [],
    }));
    return convertKeysToSnakeCase({ userName, games: gamesWithReason }) as PrefetchGamesResult;
  }

  // 패턴 추출 (API route와 동일한 로직)
  const cityCounts = new Map<string, number>();
  const typeCounts = new Map<number, number>();
  const skillCounts = new Map<string, number>();

  for (const app of pastApplications) {
    const g = app.games;
    if (g.city) cityCounts.set(g.city, (cityCounts.get(g.city) ?? 0) + 1);
    if (g.game_type !== null) typeCounts.set(g.game_type, (typeCounts.get(g.game_type) ?? 0) + 1);
    if (g.skill_level) skillCounts.set(g.skill_level, (skillCounts.get(g.skill_level) ?? 0) + 1);
  }

  const historyCities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
  const preferredCities = [...new Set([...historyCities, ...profileCities])];
  const preferredTypes = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);
  const preferredSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([s]) => s);

  // 후보 경기 조회 + 점수 기반 정렬
  const candidates = await prisma.games.findMany({
    where: {
      status: { in: [1, 2] },
      scheduled_at: { gte: new Date() },
    },
    orderBy: { scheduled_at: "asc" },
    take: 30,
    select: {
      id: true, uuid: true, title: true, scheduled_at: true,
      venue_name: true, city: true, game_type: true, skill_level: true,
      max_participants: true, current_participants: true,
    },
  });

  const scored = candidates.map((g) => {
    let score = 0;
    const reasons: string[] = [];
    if (g.city && preferredCities.includes(g.city)) { score += 3; reasons.push("자주 가는 지역"); }
    if (g.game_type !== null && preferredTypes.includes(g.game_type)) { score += 2; reasons.push("맞춤 경기 유형"); }
    if (g.skill_level && preferredSkills.includes(g.skill_level)) { score += 1; reasons.push("맞는 실력대"); }

    return {
      id: g.id.toString(),
      uuid: g.uuid,
      title: g.title,
      scheduledAt: g.scheduled_at?.toISOString() ?? null,
      venueName: g.venue_name,
      city: g.city,
      gameType: g.game_type?.toString() ?? null,
      spotsLeft: g.max_participants && g.current_participants
        ? g.max_participants - g.current_participants : null,
      matchReason: reasons,
      _score: score,
    };
  });

  scored.sort((a, b) => b._score - a._score);
  const games = scored.slice(0, 6).map(({ _score, ...rest }) => rest);

  return convertKeysToSnakeCase({ userName, games }) as PrefetchGamesResult;
}

/* -- 헬퍼: 최신 경기 조회 (API route의 getLatestGames와 동일) -- */
async function getLatestGamesForPrefetch(cities?: string[]) {
  const games = await prisma.games.findMany({
    where: {
      status: { in: [1, 2] },
      // 맞춤 지역: 부분 매칭 + 지역 미정(null)도 포함
      ...(cities && cities.length > 0 ? {
        OR: [
          ...cities.map(c => ({ city: { contains: c, mode: "insensitive" as const } })),
          { city: null },
        ],
      } : {}),
    },
    orderBy: { scheduled_at: "asc" },
    take: 6,
    select: {
      id: true, uuid: true, title: true, scheduled_at: true,
      venue_name: true, city: true, game_type: true,
      max_participants: true, current_participants: true,
    },
  });

  return games.map((g) => ({
    id: g.id.toString(),
    uuid: g.uuid,
    title: g.title,
    scheduledAt: g.scheduled_at?.toISOString() ?? null,
    venueName: g.venue_name,
    city: g.city,
    gameType: g.game_type?.toString() ?? null,
    spotsLeft: g.max_participants && g.current_participants
      ? g.max_participants - g.current_participants : null,
    matchReason: [] as string[],
  }));
}

/* -- 프리페치 결과 타입 -- */
interface PrefetchGamesResult {
  user_name: string | null;
  games: Array<{
    id: string;
    uuid: string | null;
    title: string | null;
    scheduled_at: string | null;
    venue_name: string | null;
    city: string | null;
    game_type: string | null;
    spots_left: number | null;
    match_reason: string[];
  }>;
}

/* ============================================================
 * 5. 열린 대회 프리페치 (BDR v2 Home용)
 *
 * 왜 이 함수가 필요한가:
 * v2 Home 시안의 "Promo Banner" + "열린 대회" 섹션에서 "접수중/진행중"
 * 상태의 공개 대회를 서버 측에서 미리 조회해 PromoCard / BoardRow에
 * 주입하기 위함. (기존 RecommendedTournaments는 useSWR 클라이언트 페칭
 * 방식이라 v2 서버 컴포넌트 배치에 적합하지 않음)
 *
 * 기존 `/api/web/tournaments` route.ts는 건드리지 않고, 서비스 레이어에서
 * 필요한 필드만 간단히 조회한다. is_public=true + 공개 대상 상태만.
 * ============================================================ */
export const prefetchOpenTournaments = unstable_cache(async () => {
  // 공개 + 접수중/진행중 대회만 조회 (private/draft/completed 제외)
  // 접수중 대회를 우선하도록 status 정렬 후 시작일 오름차순
  const tournaments = await prisma.tournament.findMany({
    where: {
      is_public: true,
      status: { in: ["registration", "in_progress"] },
    },
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    take: 10,
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      city: true,
      venue_name: true,
      maxTeams: true,
      edition_number: true,
      description: true,
      _count: { select: { tournamentTeams: true } },
    },
  });

  // Date 직렬화 + 필드 평탄화 (v2 컴포넌트가 받기 쉬운 형태로)
  const serialized = tournaments.map((t) => ({
    id: t.id, // uuid string
    name: t.name,
    status: t.status,
    startDate: t.startDate?.toISOString() ?? null,
    endDate: t.endDate?.toISOString() ?? null,
    city: t.city,
    venueName: t.venue_name,
    maxTeams: t.maxTeams,
    editionNumber: t.edition_number,
    description: t.description,
    teamCount: t._count.tournamentTeams,
  }));

  // apiSuccess()와 동일하게 snake_case 변환 (프론트 접근자 일관성)
  return convertKeysToSnakeCase({ tournaments: serialized }) as {
    tournaments: Array<{
      id: string;
      name: string;
      status: string | null;
      start_date: string | null;
      end_date: string | null;
      city: string | null;
      venue_name: string | null;
      max_teams: number | null;
      edition_number: number | null;
      description: string | null;
      team_count: number;
    }>;
  };
}, ["home-open-tournaments"], { revalidate: 60 });
