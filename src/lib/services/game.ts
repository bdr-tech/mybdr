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
  /** 맞춤 지역 필터 — 여러 도시를 OR 조건으로 검색 (prefer=true 시 사용) */
  cities?: string[];
  /** 맞춤 경기 유형 필터 — game_type IN (...) 조건 (prefer=true 시 사용) */
  gameTypes?: number[];
  /** 맞춤 실력 수준 필터 — skill_level IN (...) 조건 (prefer=true 시 사용) */
  skillLevels?: string[];
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
  const { q, type, city, cities, gameTypes, skillLevels, scheduledAt, take = 60 } = filters;

  const where: Prisma.gamesWhereInput = {
    // 취소(4) 제외
    status: { not: 4 },
  };
  if (q) where.title = { contains: q, mode: "insensitive" };
  // 명시적 type 파라미터가 우선, 없으면 맞춤 경기 유형(gameTypes)으로 필터
  if (type && type !== "all") {
    where.game_type = parseInt(type);
  } else if (gameTypes && gameTypes.length > 0) {
    // 맞춤 경기 유형이 설정되어 있으면 해당 유형만 표시 (city 필터와 AND 결합)
    where.game_type = { in: gameTypes };
  }

  // 맞춤 지역(cities) 우선, 단일 도시(city) 차선 — 둘 다 있으면 cities 사용
  if (cities && cities.length > 0) {
    // 선택한 지역이거나 지역이 아직 미정(null)인 경기도 포함
    // AND로 감싸서 status 등 다른 조건과 충돌하지 않도록 한다
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as Prisma.gamesWhereInput[]) : []),
      {
        OR: [
          // 각 도시명에 대해 부분 매칭 (예: "서울" → "서울특별시" 매칭)
          ...cities.map(c => ({ city: { contains: c, mode: "insensitive" as const } })),
          { city: null },
        ],
      },
    ];
  } else if (city && city !== "all") {
    where.city = { contains: city, mode: "insensitive" };
  }

  // 맞춤 실력 수준 필터: skill_level이 선택한 레벨 중 하나와 일치하는 경기만 표시
  if (skillLevels && skillLevels.length > 0) {
    where.skill_level = { in: skillLevels };
  }

  if (scheduledAt) where.scheduled_at = scheduledAt;

  // 카드 표시에 필요한 컬럼만 select (description, notes 등 불필요한 긴 텍스트 제외)
  // [2026-04-20] 다음카페 게시 순서 tie-break 를 위해 `metadata` 도 select 에 추가.
  //   - Prisma 6.x 는 JSON path 정렬을 지원하지 않으므로 DB orderBy 는 created_at 만 유지하고
  //     메모리에서 `metadata.cafe_article_id` (Int) 로 2차 정렬한다.
  //   - take=60 기준 성능 차 무의미 (정렬 복잡도 O(n log n) × n=60).
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
      author_nickname: true,
      created_at: true,
      metadata: true, // [2026-04-20] tie-break 키(cafe_article_id) 접근용
    },
  });

  // [2026-04-20] 다음카페 게시 순서 tie-break (메모리 정렬).
  //
  // 왜:
  //   - 같은 분(minute)에 올라온 카페 글은 `created_at` 이 동률이 되어 DB 정렬만으론
  //     카페 원본 게시 순서를 보장하지 못함 (실측 확인).
  //   - dataid 가 단조 증가(숫자 ↑ = 더 나중 게시)이므로 desc 로 정렬하면 카페 순서와 일치.
  //   - `metadata.cafe_article_id` 가 null 인 글(기존 15건 백필 전 or 일반 게임)은 맨 뒤로 밀린다
  //     (null last 동작 — -Infinity 로 대체해서 bId - aId desc 계산).
  //
  // 주의:
  //   - 기존 반환 형식(status override 포함)은 그대로 유지.
  //   - metadata 는 클라이언트 응답에서 게이트 없이 노출되므로 민감 키가 없는지 주기 점검 필요
  //     (현재는 cafe_* 메타만 저장 → 공개 노출 OK).
  const sorted = [...games].sort((a, b) => {
    // 1차: created_at desc
    const tA = a.created_at?.getTime() ?? 0;
    const tB = b.created_at?.getTime() ?? 0;
    if (tB !== tA) return tB - tA;
    // 2차: metadata.cafe_article_id desc (null last)
    const aId =
      typeof (a.metadata as { cafe_article_id?: number } | null)?.cafe_article_id === "number"
        ? (a.metadata as { cafe_article_id: number }).cafe_article_id
        : -Infinity;
    const bId =
      typeof (b.metadata as { cafe_article_id?: number } | null)?.cafe_article_id === "number"
        ? (b.metadata as { cafe_article_id: number }).cafe_article_id
        : -Infinity;
    return bId - aId;
  });

  // 날짜 지난 모집중(1)/확정(2) 경기 → 종료(3)로 표시
  const now = new Date();
  return sorted.map((g) => {
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
  if (!idOrShortUuid) return null;

  // 숫자 ID로 조회 시도
  const numId = Number(idOrShortUuid);
  if (!isNaN(numId) && numId > 0) {
    const game = await prisma.games.findUnique({ where: { id: BigInt(numId) } }).catch(() => null);
    if (game) return game;
  }

  // UUID (8자 이상)로 조회
  if (idOrShortUuid.length >= 8) {
    let fullUuid: string | undefined;

    if (idOrShortUuid.length === 8) {
      const rows = await prisma.$queryRaw<{ uuid: string }[]>`
        SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${idOrShortUuid + "%"} LIMIT 1
      `.catch(() => [] as { uuid: string }[]);
      fullUuid = rows[0]?.uuid;
    } else {
      fullUuid = idOrShortUuid;
    }

    if (fullUuid) {
      return prisma.games.findUnique({ where: { uuid: fullUuid } }).catch(() => null);
    }
  }

  return null;
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
