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
  const { q, type, city, scheduledAt, take = 60 } = filters;

  const where: Prisma.gamesWhereInput = {};
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (type && type !== "all") where.game_type = parseInt(type);
  if (city && city !== "all")
    where.city = { contains: city, mode: "insensitive" };
  if (scheduledAt) where.scheduled_at = scheduledAt;

  return prisma.games.findMany({
    where,
    orderBy: { scheduled_at: "asc" },
    take,
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
