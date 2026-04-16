/**
 * Tournament Service — 대회 관련 비즈니스 로직 중앙화
 *
 * 라우트 핸들러/서버 컴포넌트에서 직접 prisma를 import하지 않고
 * 이 서비스를 통해 데이터에 접근한다.
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { prisma } from "@/lib/db/prisma";
// Prisma namespace — Json 타입 호환용 InputJsonValue 캐스팅에 사용
import type { Prisma } from "@prisma/client";

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
  divisions: true,  // 목록에서 종별 표시용
  categories: true,       // 종별 뱃지 표시용 (Json)
  division_tiers: true,   // 디비전 뱃지 표시용 (Json)
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
  /** 맞춤 지역 필터 -- 여러 도시를 OR 조건으로 검색 (prefer=true 시 사용) */
  cities?: string[];
  /** 맞춤 종별 필터 -- Json 배열 교집합 매칭 (prefer=true 시 사용) */
  divisions?: string[];
  /** 맞춤 성별 필터 -- tournament.gender IN (...) 조건 (prefer=true 시 사용) */
  gender?: string[];
  take?: number;
  /** 조회자 유저 ID -- 해당 유저가 관계자인 비공개 대회도 포함 */
  viewerUserId?: bigint;
  /** 조회자가 super_admin이면 is_public 필터 무시 */
  viewerIsSuperAdmin?: boolean;
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
  // 접수 설정
  description?: string;
  registrationStartAt?: Date | null;
  registrationEndAt?: Date | null;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  categories?: Record<string, string[]>;
  divCaps?: Record<string, number>;
  divFees?: Record<string, number>;
  allowWaitingList?: boolean;
  waitingListCap?: number | null;
  entryFee?: number;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  feeNotes?: string;
  maxTeams?: number;
  teamSize?: number;
  rosterMin?: number;
  rosterMax?: number;
  autoApproveTeams?: boolean;
  // 대회 관리 확장 필드
  organizer?: string;
  host?: string;
  sponsors?: string;
  gameTime?: string;
  gameBall?: string;
  gameMethod?: string;
  places?: { name: string; address: string }[];
  gender?: string;
  rules?: string;
  prizeInfo?: string;
  // 디자인 템플릿 + 이미지 URL
  designTemplate?: string;
  logoUrl?: string;
  bannerUrl?: string;
  // settings JSON — 포맷 세부설정(bracket)/문의 연락처 등 부가 설정 저장
  settings?: Record<string, unknown>;
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
  const { status, cities, divisions, gender, take = 60, viewerUserId, viewerIsSuperAdmin } = filters;

  // where 조건을 동적으로 구성
  const where: Record<string, unknown> = {
    status: status && status !== "all" ? status : { not: "draft" },
  };

  // 공개 여부 필터 — super_admin이 아닌 경우에만 적용
  // 비공개 대회(is_public=false)는 관계자(organizer/adminMember)인 경우에만 포함
  if (!viewerIsSuperAdmin) {
    const visibilityOr: unknown[] = [{ is_public: true }];
    if (viewerUserId !== undefined) {
      visibilityOr.push({ organizerId: viewerUserId });
      visibilityOr.push({
        adminMembers: { some: { userId: viewerUserId, isActive: true } },
      });
    }
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
      { OR: visibilityOr },
    ];
  }

  // 맞춤 지역(cities) 필터: 선택한 지역이거나 지역이 아직 미정(null)인 대회도 포함
  // AND로 감싸서 status 조건과 충돌하지 않도록 한다
  if (cities && cities.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
      {
        OR: [
          // 각 도시명에 대해 부분 매칭 (예: "서울" → "서울특별시" 매칭)
          ...cities.map(c => ({ city: { contains: c, mode: "insensitive" as const } })),
          { city: null },
        ],
      },
    ];
  }

  // 맞춤 종별(divisions) 필터: division_tiers 기준으로 교집합 매칭
  // preferred_divisions에는 "D3", "D7" 등 코드가 저장되고,
  // 대회의 division_tiers 필드에도 동일한 코드가 저장됨 (divisions 필드는 한국어 텍스트라 불일치)
  // division_tiers가 비어있거나 null인 대회도 포함 (아직 설정 안 된 대회)
  if (divisions && divisions.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
      {
        OR: [
          // division_tiers 배열에 선택한 코드 중 하나라도 포함된 대회
          ...divisions.map((div) => ({
            division_tiers: { path: [], array_contains: div },
          })),
          // division_tiers가 비어있거나 설정되지 않은 대회도 포함
          { division_tiers: { equals: [] } },
          { division_tiers: { equals: null } },
        ],
      },
    ];
  }

  // 맞춤 성별 필터: 선택한 성별이거나 성별이 아직 미정(null)인 대회도 포함
  if (gender && gender.length > 0) {
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as unknown[]) : []),
      {
        OR: [
          { gender: { in: gender, mode: "insensitive" } },
          { gender: null },
        ],
      },
    ];
  }

  return prisma.tournament.findMany({
    where,
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
  const { randomBytes } = await import("crypto");
  const apiToken = randomBytes(32).toString("hex");

  const tournament = await prisma.tournament.create({
    data: {
      name: input.name,
      organizerId: input.organizerId,
      apiToken,
      format: input.format ?? "single_elimination",
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      primary_color: input.primaryColor || "#E31B23",
      secondary_color: input.secondaryColor || "#E76F51",
      status: "draft",
      // 접수 설정
      description: input.description ?? null,
      registration_start_at: input.registrationStartAt ?? null,
      registration_end_at: input.registrationEndAt ?? null,
      venue_name: input.venueName ?? null,
      venue_address: input.venueAddress ?? null,
      city: input.city ?? null,
      // 대회 관리 확장 필드
      organizer: input.organizer ?? null,
      host: input.host ?? null,
      sponsors: input.sponsors ?? null,
      game_time: input.gameTime ?? null,
      game_ball: input.gameBall ?? null,
      game_method: input.gameMethod ?? null,
      places: input.places ?? undefined,
      gender: input.gender ?? null,
      rules: input.rules ?? input.rules ?? null,
      prize_info: input.prizeInfo ?? null,
      categories: input.categories ?? {},
      div_caps: input.divCaps ?? {},
      div_fees: input.divFees ?? {},
      allow_waiting_list: input.allowWaitingList ?? false,
      waiting_list_cap: input.waitingListCap ?? null,
      entry_fee: input.entryFee ?? 0,
      bank_name: input.bankName ?? null,
      bank_account: input.bankAccount ?? null,
      bank_holder: input.bankHolder ?? null,
      fee_notes: input.feeNotes ?? null,
      maxTeams: input.maxTeams ?? 16,
      team_size: input.teamSize ?? 5,
      roster_min: input.rosterMin ?? 5,
      roster_max: input.rosterMax ?? 12,
      auto_approve_teams: input.autoApproveTeams ?? false,
      // 디자인 템플릿 + 이미지 URL
      design_template: input.designTemplate ?? null,
      logo_url: input.logoUrl ?? null,
      banner_url: input.bannerUrl ?? null,
      // settings JSON — 클라이언트가 보낸 bracket/contact_phone 등을 그대로 저장
      // 빈 객체 기본값은 스키마에서 @default("{}") 처리
      // Prisma Json 타입은 readonly 구조를 요구하므로 JSON round-trip으로 호환 값 변환
      ...(input.settings
        ? { settings: JSON.parse(JSON.stringify(input.settings)) as Prisma.InputJsonValue }
        : {}),
    },
  });

  // 서브도메인이 있으면 TournamentSite 생성
  if (input.subdomain) {
    await prisma.tournamentSite.create({
      data: {
        tournamentId: tournament.id,
        subdomain: input.subdomain,
        isPublished: false,
        primaryColor: input.primaryColor || "#E31B23",
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
  const [isOrganizer, adminMember, isRecorder] = await Promise.all([
    prisma.tournament.findFirst({
      where: { id: tournamentId, organizerId: userId },
    }),
    prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId, isActive: true },
    }),
    prisma.tournament_recorders.findFirst({
      where: { tournamentId, recorderId: userId, isActive: true },
    }),
  ]);
  return !!(isOrganizer || adminMember || isRecorder);
}
