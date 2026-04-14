import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * GET /api/web/referee-admin/fee-settings
 *   협회 배정비 단가표 조회. 모든 관리자 열람 가능.
 *   레코드가 없으면 하드코딩 기본값(주심 80k / 부심 60k / 기록 40k / 타이머 40k)을 반환.
 *
 * PUT /api/web/referee-admin/fee-settings
 *   단가표 생성/수정. 사무국장(settlement_manage)만.
 *
 * 이유: 배정 생성 시 fee 미입력이면 이 값으로 자동 산정. 협회별로 관례 배정비가 달라
 *      개별 경기마다 기억할 필요 없이 기본값을 한 번만 설정.
 *
 * 보안:
 *   - association_id는 세션에서 강제 (클라가 임의로 지정 불가 → IDOR 방지)
 *   - PUT 권한: settlement_manage (사무국장만)
 */

export const dynamic = "force-dynamic";

// 기본값 상수 — DB에 행이 없을 때 GET 응답에 사용
const DEFAULT_FEES = {
  fee_main: 80000,
  fee_sub: 60000,
  fee_recorder: 40000,
  fee_timer: 40000,
} as const;

// ── PUT body 스키마 ──
// 모든 금액은 0 이상의 정수. 음수/소수점 금지.
const putSchema = z.object({
  fee_main: z.number().int().min(0),
  fee_sub: z.number().int().min(0),
  fee_recorder: z.number().int().min(0),
  fee_timer: z.number().int().min(0),
});

// ── GET: 단가표 조회 ──
export async function GET() {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }

  try {
    const setting = await prisma.associationFeeSetting.findUnique({
      where: { association_id: admin.associationId },
      select: {
        id: true,
        association_id: true,
        fee_main: true,
        fee_sub: true,
        fee_recorder: true,
        fee_timer: true,
        updated_at: true,
      },
    });

    // 없으면 기본값 반환 (프론트에서 "처음 저장" 플로우 유도)
    if (!setting) {
      return apiSuccess({
        setting: {
          id: null,
          association_id: admin.associationId.toString(),
          ...DEFAULT_FEES,
          updated_at: null,
          is_default: true, // UI에 "아직 설정된 단가표 없음" 안내용
        },
      });
    }

    return apiSuccess({
      setting: {
        ...setting,
        is_default: false,
      },
    });
  } catch (error) {
    console.error("[referee-admin/fee-settings] GET 실패:", error);
    return apiError(
      "단가표를 불러오지 못했습니다.",
      500,
      "INTERNAL_ERROR"
    );
  }
}

// ── PUT: 단가표 저장 (upsert) ──
export async function PUT(req: NextRequest) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  // 사무국장만 단가표 수정 가능
  const denied = requirePermission(admin.role, "settlement_manage");
  if (denied) return denied;

  // body 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }
  const { fee_main, fee_sub, fee_recorder, fee_timer } = parsed.data;

  try {
    // upsert 패턴 — 없으면 생성, 있으면 업데이트. association_id는 세션 강제.
    const upserted = await prisma.associationFeeSetting.upsert({
      where: { association_id: admin.associationId },
      create: {
        association_id: admin.associationId,
        fee_main,
        fee_sub,
        fee_recorder,
        fee_timer,
      },
      update: {
        fee_main,
        fee_sub,
        fee_recorder,
        fee_timer,
      },
      select: {
        id: true,
        association_id: true,
        fee_main: true,
        fee_sub: true,
        fee_recorder: true,
        fee_timer: true,
        updated_at: true,
      },
    });

    return apiSuccess({
      setting: { ...upserted, is_default: false },
    });
  } catch (error) {
    console.error("[referee-admin/fee-settings] PUT 실패:", error);
    return apiError("단가표 저장에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
