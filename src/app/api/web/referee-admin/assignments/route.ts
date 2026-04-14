import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * POST /api/web/referee-admin/assignments
 *   심판 경기 배정 생성.
 *
 * GET /api/web/referee-admin/assignments?tournament_match_id=xxx | referee_id=xxx
 *   배정 목록 조회 (관리자용).
 *
 * 이유: 협회 관리자가 심판을 특정 경기에 배정할 수 있어야 한다.
 *      생성 권한은 sga/referee_chief/game_chief만(팀장급 이상),
 *      열람은 모든 관리자 허용.
 *
 * 보안:
 *   - POST: requirePermission("assignment_manage")
 *   - 우리 협회 심판만 배정 가능 (IDOR 방지)
 *   - DB @@unique([referee_id, tournament_match_id])로 중복 방지
 */

export const dynamic = "force-dynamic";

// ── Zod 스키마 ──
const createSchema = z.object({
  // BigInt 필드는 number로 받은 뒤 서버에서 BigInt 변환
  referee_id: z
    .union([z.number(), z.string()])
    .transform((v) => BigInt(v)),
  tournament_match_id: z
    .union([z.number(), z.string()])
    .transform((v) => BigInt(v)),
  // 역할: 주심/부심/기록원/타이머
  role: z.enum(["main", "sub", "recorder", "timer"]),
  memo: z.string().max(500).optional().nullable(),
  // 배정워크플로우 3차: 일자별 선정 풀 연결 (optional — 과도기 호환성).
  // 있으면 referee_id·tournament·date·association 4중 검증 후 pool_id로 저장.
  pool_id: z
    .union([z.number(), z.string()])
    .transform((v) => BigInt(v))
    .optional(),
});

// ── POST: 배정 생성 ──
export async function POST(req: NextRequest) {
  // 1) 권한: 팀장급 이상만 배정 생성 가능
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  // 2) body 파싱 + Zod 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }
  const { referee_id, tournament_match_id, role, memo, pool_id } = parsed.data;

  try {
    // 3) 심판 존재 + 우리 협회 소속 확인 (IDOR 방지)
    const referee = await prisma.referee.findUnique({
      where: { id: referee_id },
      select: { id: true, association_id: true },
    });
    if (!referee) {
      return apiError("심판을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (referee.association_id !== admin.associationId) {
      return apiError(
        "다른 협회 소속 심판은 배정할 수 없습니다.",
        403,
        "FORBIDDEN"
      );
    }

    // 4) 경기 존재 확인 — pool 검증에 필요하므로 tournamentId/scheduledAt도 함께 조회
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: tournament_match_id },
      select: { id: true, tournamentId: true, scheduledAt: true },
    });
    if (!match) {
      return apiError("경기를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 4-pool) 배정워크플로우 3차 — pool_id가 주어졌으면 4중 검증.
    //   (1) pool 존재 확인
    //   (2) pool.referee_id === body.referee_id  (풀과 심판 일치)
    //   (3) pool.association_id === admin.associationId  (IDOR)
    //   (4) pool.tournament_id === match.tournamentId  (대회 일치)
    //   (5) pool.date(YYYY-MM-DD) === match.scheduledAt(YYYY-MM-DD)  (날짜 일치)
    //   pool_id가 없으면 과도기 호환 — 그냥 통과.
    if (pool_id !== undefined) {
      const pool = await prisma.dailyAssignmentPool.findUnique({
        where: { id: pool_id },
        select: {
          id: true,
          referee_id: true,
          association_id: true,
          tournament_id: true,
          date: true,
        },
      });
      if (!pool) {
        return apiError(
          "선정 풀을 찾을 수 없습니다.",
          404,
          "POOL_NOT_FOUND"
        );
      }
      // (2) 풀과 심판 일치
      if (pool.referee_id !== referee_id) {
        return apiError(
          "선정 풀과 심판이 일치하지 않습니다.",
          400,
          "POOL_REFEREE_MISMATCH"
        );
      }
      // (3) 우리 협회 풀만 — IDOR 방지
      if (pool.association_id !== admin.associationId) {
        return apiError(
          "다른 협회의 선정 풀은 사용할 수 없습니다.",
          403,
          "FORBIDDEN"
        );
      }
      // (4) 대회 일치
      if (pool.tournament_id !== match.tournamentId) {
        return apiError(
          "선정 풀의 대회가 경기 대회와 다릅니다.",
          400,
          "POOL_TOURNAMENT_MISMATCH"
        );
      }
      // (5) 날짜 일치 — UTC 자정 기준 YYYY-MM-DD 비교
      if (!match.scheduledAt) {
        return apiError(
          "경기 일자가 확정되지 않아 풀을 연결할 수 없습니다.",
          400,
          "MATCH_DATE_MISSING"
        );
      }
      const poolYmd = pool.date.toISOString().slice(0, 10);
      const matchYmd = match.scheduledAt.toISOString().slice(0, 10);
      if (poolYmd !== matchYmd) {
        return apiError(
          "선정 풀 날짜와 경기 일자가 다릅니다.",
          400,
          "POOL_DATE_MISMATCH"
        );
      }
    }

    // 5) 사전 중복 체크 — DB unique로도 잡히지만 친절한 에러 제공
    const dup = await prisma.refereeAssignment.findUnique({
      where: {
        referee_id_tournament_match_id: {
          referee_id,
          tournament_match_id,
        },
      },
      select: { id: true },
    });
    if (dup) {
      return apiError(
        "이미 해당 경기에 배정된 심판입니다.",
        409,
        "DUPLICATE_ASSIGNMENT"
      );
    }

    // 6) 배정 생성 — pool_id가 주어졌으면 함께 저장(추적용)
    const created = await prisma.refereeAssignment.create({
      data: {
        referee_id,
        tournament_match_id,
        role,
        status: "assigned", // 초기 상태
        memo: memo ?? null,
        // pool_id는 optional. 없으면 null로 저장되어 기존 동작과 동일.
        pool_id: pool_id ?? null,
      },
      select: {
        id: true,
        referee_id: true,
        tournament_match_id: true,
        role: true,
        status: true,
        memo: true,
        assigned_at: true,
        pool_id: true,
      },
    });

    return apiSuccess({ assignment: created }, 201);
  } catch (error) {
    // Prisma unique 에러도 혹시 몰라 방어
    const err = error as { code?: string };
    if (err.code === "P2002") {
      return apiError(
        "이미 해당 경기에 배정된 심판입니다.",
        409,
        "DUPLICATE_ASSIGNMENT"
      );
    }
    console.error("[referee-admin/assignments] POST 실패:", error);
    return apiError("배정을 생성하지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── GET: 배정 목록 ──
export async function GET(req: NextRequest) {
  // 1) 관리자 인증 (열람 권한)
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }

  // 2) 쿼리 파라미터
  const { searchParams } = new URL(req.url);
  const matchIdRaw = searchParams.get("tournament_match_id");
  const refereeIdRaw = searchParams.get("referee_id");

  // where 조립 — 심판 기준 or 경기 기준. 둘 다 없으면 우리 협회 전체.
  // 어떤 경우든 association_id로 필터 걸어 IDOR 방지.
  const where: Record<string, unknown> = {
    referee: { association_id: admin.associationId },
  };
  if (matchIdRaw) {
    try {
      where.tournament_match_id = BigInt(matchIdRaw);
    } catch {
      return apiError("tournament_match_id가 유효하지 않습니다.", 400);
    }
  }
  if (refereeIdRaw) {
    try {
      where.referee_id = BigInt(refereeIdRaw);
    } catch {
      return apiError("referee_id가 유효하지 않습니다.", 400);
    }
  }

  try {
    const items = await prisma.refereeAssignment.findMany({
      where,
      orderBy: [{ assigned_at: "desc" }],
      select: {
        id: true,
        referee_id: true,
        tournament_match_id: true,
        role: true,
        status: true,
        memo: true,
        assigned_at: true,
        referee: {
          select: {
            id: true,
            registered_name: true,
            user: { select: { name: true, nickname: true } },
          },
        },
      },
    });

    // 표출용 referee_name 추가
    const mapped = items.map((a) => ({
      id: a.id,
      referee_id: a.referee_id,
      referee_name:
        a.referee.user?.name ??
        a.referee.user?.nickname ??
        a.referee.registered_name ??
        `심판 #${a.referee.id.toString()}`,
      tournament_match_id: a.tournament_match_id,
      role: a.role,
      status: a.status,
      memo: a.memo,
      assigned_at: a.assigned_at,
    }));

    return apiSuccess({ items: mapped });
  } catch (error) {
    console.error("[referee-admin/assignments] GET 실패:", error);
    return apiError("배정 목록을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}
