/**
 * Tournament Service — 대회 관련 비즈니스 로직 중앙화
 *
 * 라우트 핸들러/서버 컴포넌트에서 직접 prisma를 import하지 않고
 * 이 서비스를 통해 데이터에 접근한다.
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Select 상수 — 동일 쿼리의 select 객체 중복을 제거한다
// ---------------------------------------------------------------------------

/** 홈페이지, 대회 목록 등에서 사용하는 최소 select */
export const TOURNAMENT_LIST_SELECT = {
  id: true,
  name: true,
  format: true,
  status: true,
  startDate: true,
  endDate: true,
  entry_fee: true,
  city: true,
  venue_name: true,
  maxTeams: true,
  _count: { select: { tournamentTeams: true } },
} as const;

/** 홈페이지 전용 간략 select (entry_fee, endDate 불필요) */
export const TOURNAMENT_HOME_SELECT = {
  id: true,
  name: true,
  format: true,
  status: true,
  startDate: true,
} as const;

/** 내 대회 목록 (Flutter API: my-tournaments) 에서 사용하는 select */
export const MY_TOURNAMENT_SELECT = {
  id: true,
  name: true,
  status: true,
  format: true,
  startDate: true,
  endDate: true,
  venue_name: true,
  venue_address: true,
  teams_count: true,
  matches_count: true,
  apiToken: true,
  logo_url: true,
  tournament_series: { select: { name: true } },
} as const;

/** 관리자 상세 조회 include */
export const TOURNAMENT_DETAIL_INCLUDE = {
  tournamentSite: {
    select: {
      id: true,
      subdomain: true,
      isPublished: true,
      primaryColor: true,
      secondaryColor: true,
    },
  },
  adminMembers: {
    where: { isActive: true },
    select: { id: true, userId: true, role: true },
  },
  _count: {
    select: { tournamentTeams: true, tournamentMatches: true },
  },
} as const;

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------

export interface TournamentListFilters {
  status?: string;
  take?: number;
}

export interface CreateTournamentInput {
  name: string;
  organizerId: bigint;
  format?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  primaryColor?: string;
  secondaryColor?: string;
  subdomain?: string;
}

export interface UpdateTournamentData {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// 내 대회 변환 헬퍼 (my-tournaments에서 사용하는 통일된 응답 형식)
// ---------------------------------------------------------------------------

type RawMyTournament = {
  id: string;
  name: string;
  status: string | null;
  format: string | null;
  startDate: Date | null;
  endDate: Date | null;
  venue_name: string | null;
  venue_address: string | null;
  teams_count: number | null;
  matches_count: number | null;
  apiToken: string | null;
  logo_url: string | null;
  tournament_series: { name: string } | null;
};

interface MyTournamentItem {
  id: string;
  name: string;
  status: string;
  format: string | null;
  start_date: string | null;
  end_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  team_count: number;
  match_count: number;
  series_name: string | null;
  role: string;
  can_edit: boolean;
  can_record: boolean;
  api_token: string | null;
  logo_url: string | null;
}

function toMyTournamentItem(
  t: RawMyTournament,
  role: string,
  canEdit: boolean
): MyTournamentItem {
  return {
    id: t.id,
    name: t.name,
    status: t.status ?? "draft",
    format: t.format,
    start_date: t.startDate?.toISOString() ?? null,
    end_date: t.endDate?.toISOString() ?? null,
    venue_name: t.venue_name,
    venue_address: t.venue_address,
    team_count: t.teams_count ?? 0,
    match_count: t.matches_count ?? 0,
    series_name: t.tournament_series?.name ?? null,
    role,
    can_edit: canEdit,
    can_record: true,
    api_token: t.apiToken,
    logo_url: t.logo_url,
  };
}

// ---------------------------------------------------------------------------
// Service 함수
// ---------------------------------------------------------------------------

/**
 * 대회 목록 (공개) — tournaments/page.tsx, 홈페이지에서 사용
 */
export async function listTournaments(filters: TournamentListFilters = {}) {
  const { status, take = 60 } = filters;

  return prisma.tournament.findMany({
    where: {
      status: status && status !== "all" ? status : { not: "draft" },
    },
    orderBy: { startDate: "desc" },
    take,
    select: TOURNAMENT_LIST_SELECT,
  });
}

/**
 * 홈페이지용 다가오는 대회 (active/published/registration_open)
 */
export async function listUpcomingTournaments(take = 4) {
  return prisma.tournament.findMany({
    where: { status: { in: ["active", "published", "registration_open"] } },
    orderBy: { startDate: "asc" },
    take,
    select: TOURNAMENT_HOME_SELECT,
  });
}

/**
 * 대회 상세 조회 (관리자용 — include 포함)
 */
export async function getTournament(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: TOURNAMENT_DETAIL_INCLUDE,
  });
}

/**
 * 내 대회 목록 — 주최자 / admin member / 기록원 통합
 * isSuperAdmin이면 모든 대회를 가져온다.
 */
export async function getMyTournaments(
  userId: bigint,
  isSuperAdmin: boolean
): Promise<MyTournamentItem[]> {
  // 1. 주최자로 만든 대회
  const ownedTournaments = await prisma.tournament.findMany({
    where: isSuperAdmin ? {} : { organizerId: userId },
    select: MY_TOURNAMENT_SELECT,
    orderBy: { startDate: "desc" },
  });

  const resultMap = new Map<string, MyTournamentItem>(
    ownedTournaments.map((t) => [
      t.id,
      toMyTournamentItem(t, "organizer", true),
    ])
  );

  if (!isSuperAdmin) {
    // 2. admin member로 등록된 대회
    const adminMembers = await prisma.tournamentAdminMember.findMany({
      where: { userId, isActive: true },
      include: { tournament: { select: MY_TOURNAMENT_SELECT } },
    });

    for (const m of adminMembers) {
      if (!resultMap.has(m.tournament.id)) {
        resultMap.set(
          m.tournament.id,
          toMyTournamentItem(
            m.tournament,
            m.role,
            m.role === "admin" || m.role === "editor"
          )
        );
      }
    }

    // 3. 기록원으로 배정된 대회
    const recorderAssignments = await prisma.tournament_recorders.findMany({
      where: { recorderId: userId, isActive: true },
      include: { tournament: { select: MY_TOURNAMENT_SELECT } },
    });

    for (const r of recorderAssignments) {
      if (!resultMap.has(r.tournament.id)) {
        resultMap.set(
          r.tournament.id,
          toMyTournamentItem(r.tournament, "recorder", false)
        );
      }
    }
  }

  return Array.from(resultMap.values());
}

/**
 * 대회 생성
 */
export async function createTournament(input: CreateTournamentInput) {
  const tournament = await prisma.tournament.create({
    data: {
      name: input.name,
      organizerId: input.organizerId,
      format: input.format ?? "single_elimination",
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      primary_color: input.primaryColor || "#F4A261",
      secondary_color: input.secondaryColor || "#E76F51",
      status: "draft",
    },
  });

  // 서브도메인이 있으면 TournamentSite 생성
  if (input.subdomain) {
    await prisma.tournamentSite.create({
      data: {
        tournamentId: tournament.id,
        subdomain: input.subdomain,
        isPublished: false,
        primaryColor: input.primaryColor || "#F4A261",
        secondaryColor: input.secondaryColor || "#E76F51",
      },
    });
  }

  return tournament;
}

/**
 * 대회 수정
 */
export async function updateTournament(id: string, data: UpdateTournamentData) {
  return prisma.tournament.update({
    where: { id },
    data,
  });
}

/**
 * 구독 검증 — 대회 생성 권한이 있는지 확인
 * true이면 생성 가능, false이면 구독 필요
 */
export async function hasCreatePermission(userId: bigint): Promise<boolean> {
  const sub = await prisma.user_subscriptions.findFirst({
    where: {
      user_id: userId,
      feature_key: "tournament_create",
      status: "active",
      OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }],
    },
  });
  return !!sub;
}

/**
 * 전체 데이터 다운로드 (Flutter 오프라인 동기화)
 */
export async function getTournamentFullData(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) return null;

  const [teams, players, matches, playerStats] = await Promise.all([
    prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: {
        team: {
          select: { name: true, primaryColor: true, secondaryColor: true },
        },
      },
    }),
    prisma.tournamentTeamPlayer.findMany({
      where: { tournamentTeam: { tournamentId } },
      include: { users: { select: { nickname: true } } },
    }),
    prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.matchPlayerStat.findMany({
      where: { tournamentMatch: { tournamentId } },
    }),
  ]);

  return { tournament, teams, players, matches, playerStats };
}

/**
 * 대회 접근 권한 확인 (주최자 또는 admin member)
 */
export async function hasAccessToTournament(
  tournamentId: string,
  userId: bigint
): Promise<boolean> {
  const [isOrganizer, adminMember] = await Promise.all([
    prisma.tournament.findFirst({
      where: { id: tournamentId, organizerId: userId },
    }),
    prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId, isActive: true },
    }),
  ]);
  return !!(isOrganizer || adminMember);
}
