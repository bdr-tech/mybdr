/**
 * Game Service — 픽업/게스트/팀대결 경기 관련 비즈니스 로직 중앙화
 *
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------

export interface GameListFilters {
  q?: string;
  type?: string;
  city?: string;
  /** 선호 지역 필터 — 여러 도시를 OR 조건으로 검색 (prefer=true 시 사용) */
  cities?: string[];
  /** 선호 경기 유형 필터 — game_type IN (...) 조건 (prefer=true 시 사용) */
  gameTypes?: number[];
  scheduledAt?: { gte?: Date; lt?: Date };
  take?: number;
}

// ---------------------------------------------------------------------------
// Service 함수
// ---------------------------------------------------------------------------

/**
 * 경기 목록 조회 (필터 + 페이지네이션)
 */
export async function listGames(filters: GameListFilters = {}) {
  const { q, type, city, cities, gameTypes, scheduledAt, take = 60 } = filters;

  const where: Prisma.gamesWhereInput = {
    // 취소(4) 제외
    status: { not: 4 },
  };
  if (q) where.title = { contains: q, mode: "insensitive" };
  // 명시적 type 파라미터가 우선, 없으면 선호 경기 유형(gameTypes)으로 필터
  if (type && type !== "all") {
    where.game_type = parseInt(type);
  } else if (gameTypes && gameTypes.length > 0) {
    // 선호 경기 유형이 설정되어 있으면 해당 유형만 표시 (city 필터와 AND 결합)
    where.game_type = { in: gameTypes };
  }

  // 선호 지역(cities) 우선, 단일 도시(city) 차선 — 둘 다 있으면 cities 사용
  if (cities && cities.length > 0) {
    // 여러 도시를 OR 조건으로 묶어 검색
    where.city = { in: cities, mode: "insensitive" };
  } else if (city && city !== "all") {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (scheduledAt) where.scheduled_at = scheduledAt;

  // 카드 표시에 필요한 컬럼만 select (description, notes 등 불필요한 긴 텍스트 제외)
  const games = await prisma.games.findMany({
    where,
    orderBy: { created_at: "desc" },
    take,
    select: {
      id: true,
      uuid: true,
      title: true,
      status: true,
      game_type: true,
      city: true,
      district: true,
      venue_name: true,
      scheduled_at: true,
      max_participants: true,
      current_participants: true,
      fee_per_person: true,
      skill_level: true,
      created_at: true,
    },
  });

  // 날짜 지난 모집중(1)/확정(2) 경기 → 종료(3)로 표시
  const now = new Date();
  return games.map((g) => {
    if ((g.status === 1 || g.status === 2) && g.scheduled_at && g.scheduled_at < now) {
      return { ...g, status: 3 };
    }
    return g;
  });
}

/**
 * 경기 가능한 도시 목록 (게임 수 내림차순)
 */
export async function listGameCities(take = 30) {
  const rows = await prisma.games.groupBy({
    by: ["city"],
    where: { city: { not: null } },
    orderBy: { _count: { city: "desc" } },
    take,
  });
  return rows.map((r) => r.city!).filter(Boolean);
}

/**
 * 홈페이지용 최근/추천 경기 (status 1=모집중, 2=마감)
 */
export async function listRecentGames(take = 4) {
  return prisma.games.findMany({
    where: { status: { in: [1, 2] } },
    orderBy: { scheduled_at: "asc" },
    take,
    select: {
      id: true,
      uuid: true,
      title: true,
      scheduled_at: true,
      venue_name: true,
      city: true,
    },
  });
}

/**
 * 경기 상세 조회 (UUID 또는 short UUID)
 * shortId (8자)이면 LIKE 검색, 아니면 정확 매칭.
 * @returns game 또는 null
 */
export async function getGame(idOrShortUuid: string) {
  let fullUuid: string | undefined;

  if (idOrShortUuid.length === 8) {
    const rows = await prisma.$queryRaw<{ uuid: string }[]>`
      SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${idOrShortUuid + "%"} LIMIT 1
    `.catch(() => [] as { uuid: string }[]);
    fullUuid = rows[0]?.uuid;
  } else {
    fullUuid = idOrShortUuid;
  }

  if (!fullUuid) return null;

  return prisma.games.findUnique({ where: { uuid: fullUuid } }).catch(() => null);
}

/**
 * 경기 신청자 목록 조회
 */
export async function listGameApplications(gameId: bigint) {
  return prisma.game_applications.findMany({
    where: { game_id: gameId },
    include: {
      users: {
        select: {
          nickname: true,
          name: true,
          phone: true,
          position: true,
          city: true,
          district: true,
        },
      },
    },
    orderBy: { created_at: "asc" },
  });
}
