import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/web/recommended-games
 *
 * 로그인 유저: 패턴 기반 개인화 추천
 *   1) 유저의 지역(city), 참가했던 경기 유형, 실력대를 분석
 *   2) 매칭되는 경기를 우선 정렬
 *   3) 패턴 데이터 부족 시 → user.city split하여 지역 기반 추천
 *
 * 비로그인: 최신 경기 목록
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  // --- 비로그인 fallback: 최신 경기 ---
  if (!session) {
    const games = await getLatestGames();
    return apiSuccess({ userName: null, games });
  }

  const userId = BigInt(session.sub);

  // 유저 프로필 + 참가 이력을 병렬 조회
  const [user, pastApplications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true, name: true, city: true, district: true },
    }).catch(() => null),

    // 최근 참가 신청 이력 (최대 20건) → 패턴 분석용
    prisma.game_applications.findMany({
      where: { user_id: userId, status: { in: [1, 2] } }, // 1=approved, 2=pending
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

  // user.city를 쉼표 구분 문자열에서 배열로 변환 (예: "서울,경기" → ["서울", "경기"])
  const profileCities = user?.city
    ? user.city.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  // --- 패턴 분석 ---
  const hasHistory = pastApplications.length >= 3;

  if (!hasHistory) {
    // 이력 부족 → 프로필 지역(배열) 기반 추천, 없으면 전체 최신 경기
    const games = await getLatestGames(profileCities.length > 0 ? profileCities : undefined);
    return apiSuccess({
      userName,
      games: games.map((g) => ({
        ...g,
        // matchReason을 배열로 반환 (지역 매칭 시 이유 추가)
        matchReason: g.city && profileCities.includes(g.city)
          ? ["내 지역 경기"]
          : [],
      })),
    });
  }

  // 패턴 추출: 선호 지역, 경기 유형, 실력대
  const cityCounts = new Map<string, number>();
  const typeCounts = new Map<number, number>();
  const skillCounts = new Map<string, number>();

  for (const app of pastApplications) {
    const g = app.games;
    if (g.city) cityCounts.set(g.city, (cityCounts.get(g.city) ?? 0) + 1);
    if (g.game_type !== null) typeCounts.set(g.game_type, (typeCounts.get(g.game_type) ?? 0) + 1);
    if (g.skill_level) skillCounts.set(g.skill_level, (skillCounts.get(g.skill_level) ?? 0) + 1);
  }

  // 이력에서 추출한 선호 지역 (최대 3개)
  const historyCities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  // 프로필 지역으로 보완: 이력 지역 + 프로필 지역 합집합 (중복 제거)
  const preferredCities = [...new Set([...historyCities, ...profileCities])];

  const preferredTypes = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t);

  const preferredSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([s]) => s);

  // 매칭 경기 조회 — 넓은 범위로 가져온 뒤 점수 정렬
  const candidates = await prisma.games.findMany({
    where: {
      status: { in: [1, 2] },
      scheduled_at: { gte: new Date() },
    },
    orderBy: { scheduled_at: "asc" },
    take: 30,
    select: {
      id: true,
      uuid: true,
      title: true,
      scheduled_at: true,
      venue_name: true,
      city: true,
      game_type: true,
      skill_level: true,
      max_participants: true,
      current_participants: true,
    },
  });

  // 점수 기반 정렬 — matchReason을 배열로 수집하여 복수 이유 반환
  const scored = candidates.map((g) => {
    let score = 0;
    const reasons: string[] = [];

    if (g.city && preferredCities.includes(g.city)) {
      score += 3;
      reasons.push("자주 가는 지역");
    }
    if (g.game_type !== null && preferredTypes.includes(g.game_type)) {
      score += 2;
      reasons.push("선호 경기 유형");
    }
    if (g.skill_level && preferredSkills.includes(g.skill_level)) {
      score += 1;
      reasons.push("맞는 실력대");
    }

    return {
      id: g.id.toString(),
      uuid: g.uuid,
      title: g.title,
      scheduledAt: g.scheduled_at?.toISOString() ?? null,
      venueName: g.venue_name,
      city: g.city,
      gameType: g.game_type?.toString() ?? null,
      spotsLeft:
        g.max_participants && g.current_participants
          ? g.max_participants - g.current_participants
          : null,
      matchReason: reasons,
      _score: score,
    };
  });

  scored.sort((a, b) => b._score - a._score);

  const games = scored.slice(0, 6).map(({ _score, ...rest }) => rest);

  return apiSuccess({ userName, games });
}

// --- Helper: 최신 경기 조회 ---
// cities 배열을 받아 { in: cities } 조건으로 필터링 (여러 도시 동시 매칭)
async function getLatestGames(cities?: string[]) {
  const games = await prisma.games.findMany({
    where: {
      status: { in: [1, 2] },
      ...(cities && cities.length > 0 ? { city: { in: cities } } : {}),
    },
    orderBy: { scheduled_at: "asc" },
    take: 6,
    select: {
      id: true,
      uuid: true,
      title: true,
      scheduled_at: true,
      venue_name: true,
      city: true,
      game_type: true,
      max_participants: true,
      current_participants: true,
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
    spotsLeft:
      g.max_participants && g.current_participants
        ? g.max_participants - g.current_participants
        : null,
    matchReason: [] as string[],
  }));
}
