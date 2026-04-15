import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";
// 선정 시 심판 본인에게 알림 발송 — 헬퍼 내부에서 try/catch 처리
import { notifyPoolSelected } from "@/lib/notifications/referee-events";
// 헬스체크 봇의 쓰기 작업 차단 가드
import { requireNotBot } from "@/lib/healthcheck/is-bot";

/**
 * /api/web/referee-admin/pools
 *
 * POST — 일자별 풀에 심판/경기원 "선정" (신청자 중 확정)
 * GET  — 특정 대회/일자의 풀 목록 조회
 *
 * 이유: 공고(AssignmentAnnouncement)에 신청(AssignmentApplication)이 들어오면
 *       협회 관리자가 "이 사람을 이 날짜에 쓰겠다"고 확정하는 단계가 필요하다.
 *       이 확정 정보가 DailyAssignmentPool로 쌓이고, 3차에서 경기별 배정으로 내려간다.
 *
 * 보안:
 *   - POST: requirePermission("assignment_manage") — 사무국장/심판팀장/경기팀장
 *   - GET:  getAssociationAdmin() — 모든 관리자 열람 가능
 *   - association_id는 세션에서 강제 (IDOR 방지)
 *   - Referee가 해당 협회 소속 + 해당 공고에 + 해당 일자로 신청했는지 전량 검증
 */

export const dynamic = "force-dynamic";

// "YYYY-MM-DD" → UTC 자정 Date (기존 announcements와 동일 규약)
function toUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

// Date → "YYYY-MM-DD" (UTC 기준)
function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Zod: POST 선정 ──
// tournament_id: Tournament.id(UUID) 문자열
// referee_id:    BigInt (클라이언트는 number/string으로 보냄)
const createSchema = z.object({
  tournament_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  referee_id: z.union([z.number(), z.string()]).transform((v) => BigInt(v)),
  role_type: z.enum(["referee", "game_official"]),
  memo: z.string().max(1000).optional().nullable(),
});

// ── POST: 선정 ──
export async function POST(req: NextRequest) {
  // 1) 권한 — 선정은 팀장급 이상
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  // 1-1) 봇 방어 — 헬스체크 봇 계정은 쓰기 차단
  const botCheck = await requireNotBot(admin.userId);
  if (botCheck) return botCheck.error;

  // 2) body 파싱 + Zod 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { tournament_id, date, referee_id, role_type, memo } = parsed.data;

  try {
    // 3) Referee가 해당 협회 소속인지 확인 (IDOR 방지 핵심)
    //    다른 협회 심판을 내 협회 풀에 넣을 수 없어야 한다.
    const referee = await prisma.referee.findUnique({
      where: { id: referee_id },
      select: { id: true, association_id: true, role_type: true },
    });
    if (!referee) {
      return apiError("심판을 찾을 수 없습니다.", 404, "REFEREE_NOT_FOUND");
    }
    if (referee.association_id !== admin.associationId) {
      return apiError(
        "다른 협회 소속 심판은 선정할 수 없습니다.",
        403,
        "FORBIDDEN"
      );
    }

    // 4) 해당 공고(tournament+association+role_type) 중 referee가 신청한 Application을 찾는다.
    //    Announcement를 tournament+association+role_type으로 여러 개 띄웠을 수 있으므로,
    //    해당 referee가 이 조합에 신청한 Application 중 date까지 포함한 것이 있어야 한다.
    const dateUtc = toUtcDate(date);
    const matchedApp = await prisma.assignmentApplication.findFirst({
      where: {
        referee_id,
        announcement: {
          tournament_id,
          association_id: admin.associationId,
          role_type,
        },
        dates: {
          // 해당 일자가 선택된 신청이어야 선정 가능
          some: { date: dateUtc },
        },
      },
      select: { id: true },
    });
    if (!matchedApp) {
      return apiError(
        "해당 심판이 이 대회·일자로 신청한 기록이 없습니다.",
        400,
        "NOT_APPLIED"
      );
    }

    // 5) DailyAssignmentPool 생성 (unique: tournament_id+date+referee_id+role_type)
    const created = await prisma.dailyAssignmentPool.create({
      data: {
        tournament_id,
        association_id: admin.associationId, // ★ IDOR 방지
        date: dateUtc,
        referee_id,
        role_type,
        is_chief: false, // 기본 false — 별도 PATCH로 토글
        selected_by: admin.userId,
        memo: memo ?? null,
      },
      select: {
        id: true,
        tournament_id: true,
        date: true,
        referee_id: true,
        role_type: true,
        is_chief: true,
        memo: true,
        created_at: true,
      },
    });

    // 6) 알림: 선정된 심판에게 "XX대회 YYYY-MM-DD 선정" 알림 발송
    //    이유: 선정되자마자 심판이 일정을 확인하고 필요 시 사전 준비 가능.
    //    tournament_name이 필요하므로 이름만 간단히 조회 (select로 최소화).
    const tournamentInfo = await prisma.tournament.findUnique({
      where: { id: tournament_id },
      select: { name: true },
    });
    await notifyPoolSelected([referee_id], {
      tournament_name: tournamentInfo?.name ?? "대회",
      date: dateUtc,
      role_type,
    });

    return apiSuccess({ pool: created }, 201);
  } catch (error) {
    const err = error as { code?: string };
    // unique 제약 충돌 시 친절 에러
    if (err.code === "P2002") {
      return apiError(
        "이미 선정된 심판입니다.",
        409,
        "DUPLICATE_POOL"
      );
    }
    console.error("[referee-admin/pools] POST 실패:", error);
    return apiError("선정에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── GET: 풀 조회 ──
// 쿼리: tournament_id (필수), date (YYYY-MM-DD, 선택)
export async function GET(req: NextRequest) {
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");

  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  const date = searchParams.get("date");

  if (!tournamentId) {
    return apiError("tournament_id가 필요합니다.", 400, "BAD_REQUEST");
  }
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError("date 형식이 올바르지 않습니다.", 400, "BAD_REQUEST");
  }

  // where: 항상 association_id로 잠금 (IDOR 방지)
  const where: Record<string, unknown> = {
    tournament_id: tournamentId,
    association_id: admin.associationId,
  };
  if (date) where.date = toUtcDate(date);

  try {
    const pools = await prisma.dailyAssignmentPool.findMany({
      where,
      orderBy: [{ date: "asc" }, { is_chief: "desc" }, { created_at: "asc" }],
      select: {
        id: true,
        tournament_id: true,
        date: true,
        referee_id: true,
        role_type: true,
        is_chief: true,
        memo: true,
        selected_by: true,
        created_at: true,
        referee: {
          select: {
            id: true,
            registered_name: true,
            level: true,
            role_type: true,
            user: { select: { name: true, nickname: true } },
            certificates: {
              select: { cert_grade: true, cert_type: true, verified: true },
              where: { verified: true },
              orderBy: { issued_at: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    // 응답 포맷 — 이름/등급 정리
    const items = pools.map((p) => ({
      id: p.id,
      tournament_id: p.tournament_id,
      date: p.date,
      referee_id: p.referee_id,
      role_type: p.role_type,
      is_chief: p.is_chief,
      memo: p.memo,
      selected_by: p.selected_by,
      created_at: p.created_at,
      referee_name:
        p.referee.user?.name ??
        p.referee.user?.nickname ??
        p.referee.registered_name ??
        `심판 #${p.referee.id.toString()}`,
      referee_level: p.referee.level,
      referee_role_type: p.referee.role_type,
      referee_cert_grade: p.referee.certificates[0]?.cert_grade ?? null,
    }));

    return apiSuccess({ items });
  } catch (error) {
    console.error("[referee-admin/pools] GET 실패:", error);
    return apiError("풀 목록을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}
