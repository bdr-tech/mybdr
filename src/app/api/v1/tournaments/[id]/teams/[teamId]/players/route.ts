import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, apiError, forbidden, validationError } from "@/lib/api/response";
import { verifyToken } from "@/lib/auth/jwt";
import { onsitePlayerRegistrationSchema } from "@/lib/validation/player";

// ---------------------------------------------------------------------------
// 인증 헬퍼: JWT 우선, API Token 폴백 (match sync 패턴 재사용)
// ---------------------------------------------------------------------------
async function authenticateRequest(
  req: NextRequest,
  tournamentId: string
): Promise<AuthContext | Response> {
  const token = req.headers.get("authorization")?.replace(/^(Bearer|Token)\s+/i, "");
  if (!token) return apiError("Unauthorized", 401);

  // JWT 인증 시도
  const payload = await verifyToken(token);
  if (payload) {
    return { userId: payload.sub, userRole: payload.role, payload };
  }

  // API token 폴백
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { apiToken: true, organizerId: true },
  });

  if (tournament?.apiToken && tournament.apiToken === token) {
    return {
      userId: String(tournament.organizerId),
      userRole: "organizer",
      payload: { sub: String(tournament.organizerId), email: "", name: "", role: "organizer" },
    };
  }

  return apiError("Unauthorized", 401);
}

// ---------------------------------------------------------------------------
// 권한 검증: super_admin/admin 또는 대회 관리자/기록원만 허용 (FR-108)
// ---------------------------------------------------------------------------
async function checkTournamentAccess(
  ctx: AuthContext,
  tournamentId: string
): Promise<boolean> {
  const isSuperUser = ctx.userRole === "super_admin" || ctx.userRole === "admin";
  if (isSuperUser) return true;

  const [adminMember, recorder] = await Promise.all([
    prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId: BigInt(ctx.userId), isActive: true },
    }),
    prisma.tournament_recorders.findFirst({
      where: { tournamentId, recorderId: BigInt(ctx.userId), isActive: true },
    }),
  ]);

  return !!(adminMember || recorder);
}

// ---------------------------------------------------------------------------
// POST: 현장 선수 등록 (FR-101 ~ FR-113)
// ---------------------------------------------------------------------------
async function handlePost(
  req: NextRequest,
  ctx: AuthContext,
  tournamentId: string,
  teamId: string
) {
  // 권한 확인
  const hasAccess = await checkTournamentAccess(ctx, tournamentId);
  if (!hasAccess) return forbidden("No access to this tournament");

  // 요청 바디 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError([{ message: "Invalid JSON body" }]);
  }

  // Zod 검증
  const result = onsitePlayerRegistrationSchema.safeParse(body);
  if (!result.success) {
    return validationError(result.error.issues);
  }

  const { player_name, jersey_number, position, birth_date } = result.data;

  // 팀 존재 확인 (해당 대회 소속인지)
  const tournamentTeam = await prisma.tournamentTeam.findFirst({
    where: { id: BigInt(teamId), tournamentId },
  });
  if (!tournamentTeam) return apiError("Team not found in tournament", 404);

  // 등번호 중복 체크 (팀 내 유니크, FR-104)
  const existingPlayer = await prisma.tournamentTeamPlayer.findFirst({
    where: {
      tournamentTeamId: BigInt(teamId),
      jerseyNumber: jersey_number,
      is_active: true,
    },
  });
  if (existingPlayer) {
    return apiError(`이미 사용 중인 등번호입니다 (등번호: ${jersey_number})`, 400);
  }

  // 선수 생성 (userId = null, auto_registered = true, FR-103, FR-105, FR-113)
  const player = await prisma.tournamentTeamPlayer.create({
    data: {
      tournamentTeamId: BigInt(teamId),
      userId: null,
      player_name,
      jerseyNumber: jersey_number,
      position: position ?? null,
      birth_date: birth_date ?? null,
      role: "player",
      auto_registered: true,
      is_active: true,
      isStarter: false,
    },
  });

  return apiSuccess(
    {
      id: Number(player.id),
      tournament_team_id: Number(player.tournamentTeamId),
      user_id: null,
      player_name: player.player_name,
      jersey_number: player.jerseyNumber,
      position: player.position,
      is_active: true,
      auto_registered: true,
      is_starter: false,
    },
    201
  );
}

// ---------------------------------------------------------------------------
// GET: 팀 선수 목록 조회 (증분 동기화용)
// ---------------------------------------------------------------------------
async function handleGet(
  req: NextRequest,
  ctx: AuthContext,
  tournamentId: string,
  teamId: string
) {
  // 권한 확인
  const hasAccess = await checkTournamentAccess(ctx, tournamentId);
  if (!hasAccess) return forbidden("No access to this tournament");

  // 팀 존재 확인
  const tournamentTeam = await prisma.tournamentTeam.findFirst({
    where: { id: BigInt(teamId), tournamentId },
  });
  if (!tournamentTeam) return apiError("Team not found in tournament", 404);

  // updated_after 쿼리 파라미터 (증분 동기화)
  const updatedAfterParam = req.nextUrl.searchParams.get("updated_after");
  const where: Record<string, unknown> = {
    tournamentTeamId: BigInt(teamId),
    is_active: true,
  };

  if (updatedAfterParam) {
    const updatedAfter = new Date(updatedAfterParam);
    if (isNaN(updatedAfter.getTime())) {
      return apiError("Invalid updated_after format", 400);
    }
    where.updatedAt = { gte: updatedAfter };
  }

  const players = await prisma.tournamentTeamPlayer.findMany({
    where,
    include: { users: { select: { name: true, nickname: true } } },
    orderBy: { jerseyNumber: "asc" },
  });

  return apiSuccess({
    players: players.map((p) => ({
      id: Number(p.id),
      tournament_team_id: Number(p.tournamentTeamId),
      user_id: p.userId?.toString() ?? null,
      player_name: p.player_name,
      user_name: p.users?.name ?? p.player_name ?? `Player #${p.jerseyNumber ?? p.id}`,
      jersey_number: p.jerseyNumber,
      position: p.position,
      is_active: p.is_active ?? true,
      auto_registered: p.auto_registered ?? false,
      is_starter: p.isStarter ?? false,
      updated_at: p.updatedAt.toISOString(),
    })),
  });
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------
type RouteContext = { params: Promise<{ id: string; teamId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const { id, teamId } = await context.params;

  return withErrorHandler(async (r: NextRequest) => {
    const authResult = await authenticateRequest(r, id);
    if (authResult instanceof Response) return authResult;
    return handlePost(r, authResult, id, teamId);
  })(req);
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id, teamId } = await context.params;

  return withErrorHandler(async (r: NextRequest) => {
    const authResult = await authenticateRequest(r, id);
    if (authResult instanceof Response) return authResult;
    return handleGet(r, authResult, id, teamId);
  })(req);
}
