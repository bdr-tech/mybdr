import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * /api/web/referee-admin/announcements/[id]
 *
 * GET    — 공고 상세 (신청자 목록 포함)
 * PATCH  — 공고 수정 (제목/설명/일자/필요인원/마감일/상태)
 * DELETE — 공고 삭제 (Cascade로 applications 함께 삭제됨)
 *
 * 이유: 게시된 공고의 신청 현황을 확인하고, 필요 시 마감 전 수정/취소할 수 있어야 한다.
 *
 * 보안:
 *   - 모든 메서드: association_id 검증 (IDOR 방지)
 *   - PATCH/DELETE: requirePermission("assignment_manage")
 */

export const dynamic = "force-dynamic";

function toUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

// ── Zod 스키마: PATCH ──
// 모든 필드 optional — 부분 업데이트 지원
const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .min(1)
    .max(31)
    .optional(),
  required_count: z
    .record(z.string(), z.number().int().min(0).max(100))
    .optional(),
  deadline: z.string().datetime().nullable().optional(),
  status: z.enum(["open", "closed", "cancelled"]).optional(),
});

// ── id 파서: BigInt 변환 + 검증 ──
function parseId(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

// ── GET: 공고 상세 ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");

  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) return apiError("유효하지 않은 id입니다.", 400, "BAD_REQUEST");

  try {
    const announcement = await prisma.assignmentAnnouncement.findUnique({
      where: { id },
      select: {
        id: true,
        tournament_id: true,
        association_id: true,
        title: true,
        description: true,
        role_type: true,
        dates: true,
        required_count: true,
        deadline: true,
        status: true,
        created_at: true,
        updated_at: true,
        applications: {
          select: {
            id: true,
            referee_id: true,
            memo: true,
            status: true,
            created_at: true,
            dates: { select: { date: true } },
            referee: {
              select: {
                id: true,
                registered_name: true,
                registered_phone: true,
                user: { select: { name: true, nickname: true, phone: true } },
              },
            },
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!announcement) return apiError("공고를 찾을 수 없습니다.", 404, "NOT_FOUND");

    // IDOR 검증
    if (announcement.association_id !== admin.associationId) {
      return apiError("다른 협회 공고에는 접근할 수 없습니다.", 403, "FORBIDDEN");
    }

    // 대회명
    const t = await prisma.tournament.findUnique({
      where: { id: announcement.tournament_id },
      select: { name: true },
    });

    // applications의 referee 이름 표출용 정리
    const applications = announcement.applications.map((a) => ({
      id: a.id,
      referee_id: a.referee_id,
      referee_name:
        a.referee.user?.name ??
        a.referee.user?.nickname ??
        a.referee.registered_name ??
        `심판 #${a.referee.id.toString()}`,
      referee_phone: a.referee.user?.phone ?? a.referee.registered_phone ?? null,
      memo: a.memo,
      status: a.status,
      created_at: a.created_at,
      dates: a.dates.map((d) => d.date),
    }));

    return apiSuccess({
      announcement: {
        id: announcement.id,
        tournament_id: announcement.tournament_id,
        tournament_name: t?.name ?? null,
        title: announcement.title,
        description: announcement.description,
        role_type: announcement.role_type,
        dates: announcement.dates,
        required_count: announcement.required_count,
        deadline: announcement.deadline,
        status: announcement.status,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at,
        applications,
      },
    });
  } catch (error) {
    console.error("[referee-admin/announcements/:id] GET 실패:", error);
    return apiError("공고를 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── PATCH: 공고 수정 ──
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");

  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) return apiError("유효하지 않은 id입니다.", 400, "BAD_REQUEST");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  // dates + required_count 키 일치 검증 (둘 중 하나라도 들어올 때)
  const { dates, required_count } = parsed.data;
  if (dates && required_count) {
    const dateSet = new Set(dates);
    for (const k of Object.keys(required_count)) {
      if (!dateSet.has(k)) {
        return apiError(
          `required_count의 일자 "${k}"가 dates에 없습니다.`,
          400,
          "INVALID_REQUIRED_COUNT"
        );
      }
    }
  }

  try {
    // 소유권 검증
    const existing = await prisma.assignmentAnnouncement.findUnique({
      where: { id },
      select: { association_id: true },
    });
    if (!existing) return apiError("공고를 찾을 수 없습니다.", 404, "NOT_FOUND");
    if (existing.association_id !== admin.associationId) {
      return apiError("다른 협회 공고는 수정할 수 없습니다.", 403, "FORBIDDEN");
    }

    // 업데이트 data 조립 — undefined는 Prisma가 무시
    const data: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (dates !== undefined) data.dates = dates.map(toUtcDate);
    if (required_count !== undefined) data.required_count = required_count;
    if (parsed.data.deadline !== undefined) {
      data.deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;
    }
    if (parsed.data.status !== undefined) data.status = parsed.data.status;

    const updated = await prisma.assignmentAnnouncement.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        dates: true,
        required_count: true,
        deadline: true,
        status: true,
        updated_at: true,
      },
    });

    return apiSuccess({ announcement: updated });
  } catch (error) {
    console.error("[referee-admin/announcements/:id] PATCH 실패:", error);
    return apiError("공고를 수정하지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── DELETE: 공고 삭제 ──
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");

  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) return apiError("유효하지 않은 id입니다.", 400, "BAD_REQUEST");

  try {
    const existing = await prisma.assignmentAnnouncement.findUnique({
      where: { id },
      select: { association_id: true },
    });
    if (!existing) return apiError("공고를 찾을 수 없습니다.", 404, "NOT_FOUND");
    if (existing.association_id !== admin.associationId) {
      return apiError("다른 협회 공고는 삭제할 수 없습니다.", 403, "FORBIDDEN");
    }

    // Cascade로 applications/application_dates 함께 삭제됨
    await prisma.assignmentAnnouncement.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("[referee-admin/announcements/:id] DELETE 실패:", error);
    return apiError("공고를 삭제하지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}
