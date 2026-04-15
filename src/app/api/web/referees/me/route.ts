import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import {
  refereeCreateSchema,
  refereeUpdateSchema,
} from "@/lib/validation/referee";

/**
 * /api/web/referees/me
 *
 * 본인의 Referee 프로필 CRUD 엔드포인트.
 * - GET: 조회 (없으면 404 + has_referee:false)
 * - POST: 신규 생성 (이미 있으면 409)
 * - PUT: 본인 소유 수정
 * - DELETE: 본인 Referee 삭제 (cascade로 자격증 동반 삭제)
 *
 * IDOR 방지 원칙:
 * - user_id는 항상 세션(ctx.userId) 기반. 클라이언트가 body에 user_id를 넣어도 무시.
 * - 본인 1개만 생성/조회/수정 가능.
 */

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET — 본인 Referee + 자격증 조회
// ─────────────────────────────────────────────────────────────
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    const referee = await prisma.referee.findUnique({
      where: { user_id: ctx.userId },
      include: {
        // 본인 자격증 전체 (issued_at 최신순)
        certificates: {
          orderBy: { issued_at: "desc" },
        },
        // 협회 기본 정보 (이름/코드만)
        association: {
          select: { id: true, code: true, name: true, level: true },
        },
      },
    });

    if (!referee) {
      // 심판 프로필 미등록 상태: 200 + has_referee:false로 반환
      // (404를 쓰면 "리소스 없음"과 "프로필 미등록"이 구분 안 되므로 200이 적합)
      return apiSuccess({ has_referee: false, referee: null });
    }

    return apiSuccess({ has_referee: true, referee });
  } catch {
    return apiError("심판 정보를 불러올 수 없습니다.", 500);
  }
});

// ─────────────────────────────────────────────────────────────
// POST — 본인 Referee 생성
// ─────────────────────────────────────────────────────────────
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("유효하지 않은 요청입니다.", 400);
  }

  // Zod 검증 — user_id는 스키마에 없으므로 body에 실려와도 자동 탈락
  const parsed = refereeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 값입니다.", 400, "VALIDATION_ERROR");
  }
  const data = parsed.data;

  try {
    // 이미 본인 Referee가 있는지 체크 (1인 1 프로필)
    const existing = await prisma.referee.findUnique({
      where: { user_id: ctx.userId },
      select: { id: true },
    });
    if (existing) {
      return apiError("이미 심판 프로필이 등록되어 있습니다.", 409, "ALREADY_EXISTS");
    }

    // association_id는 Zod에서 문자열로 들어오므로 BigInt 변환
    const associationId =
      data.association_id != null ? BigInt(data.association_id) : null;

    const created = await prisma.referee.create({
      data: {
        // user_id는 서버에서 강제 주입 (IDOR 방지)
        user_id: ctx.userId,
        association_id: associationId,
        license_number: data.license_number ?? null,
        level: data.level ?? null,
        // role_type 기본값은 Prisma default("referee") 적용
        role_type: data.role_type ?? "referee",
        region_sido: data.region_sido ?? null,
        region_sigungu: data.region_sigungu ?? null,
        bio: data.bio ?? null,
      },
    });

    return apiSuccess({ has_referee: true, referee: created }, 201);
  } catch (err) {
    // unique 제약 위반: 어느 필드인지 구분하여 정확한 에러 메시지 반환
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      const target = (err as { meta?: { target?: string[] } }).meta?.target;
      if (target?.includes("user_id")) {
        return apiError("이미 심판 프로필이 등록되어 있습니다.", 409, "ALREADY_EXISTS");
      }
      return apiError("이미 사용 중인 자격번호입니다.", 409, "ALREADY_EXISTS");
    }
    return apiError("심판 프로필을 생성할 수 없습니다.", 500);
  }
});

// ─────────────────────────────────────────────────────────────
// PUT — 본인 Referee 수정
// ─────────────────────────────────────────────────────────────
export const PUT = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("유효하지 않은 요청입니다.", 400);
  }

  const parsed = refereeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 값입니다.", 400, "VALIDATION_ERROR");
  }
  const data = parsed.data;

  try {
    // 본인 Referee 존재 확인 + 소유권 확인 (user_id unique 조회로 동시 해결)
    const existing = await prisma.referee.findUnique({
      where: { user_id: ctx.userId },
      select: { id: true },
    });
    if (!existing) {
      return apiError("심판 프로필이 없습니다.", 404, "NOT_FOUND");
    }

    // undefined인 필드는 업데이트 대상에서 제외, null은 명시적 지우기로 취급
    const updateData: Record<string, unknown> = {};
    if (data.association_id !== undefined) {
      updateData.association_id =
        data.association_id == null ? null : BigInt(data.association_id);
    }
    if (data.license_number !== undefined)
      updateData.license_number = data.license_number;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.role_type !== undefined) updateData.role_type = data.role_type;
    if (data.region_sido !== undefined) updateData.region_sido = data.region_sido;
    if (data.region_sigungu !== undefined)
      updateData.region_sigungu = data.region_sigungu;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.bio !== undefined) updateData.bio = data.bio;

    const updated = await prisma.referee.update({
      // where는 본인 PK(user_id unique)로 IDOR 원천 차단
      where: { user_id: ctx.userId },
      data: updateData,
    });

    return apiSuccess({ has_referee: true, referee: updated });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return apiError("이미 사용 중인 자격번호입니다.", 409, "ALREADY_EXISTS");
    }
    return apiError("심판 프로필을 수정할 수 없습니다.", 500);
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE — 본인 Referee 삭제
// ─────────────────────────────────────────────────────────────
export const DELETE = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    const existing = await prisma.referee.findUnique({
      where: { user_id: ctx.userId },
      select: { id: true },
    });
    if (!existing) {
      return apiError("심판 프로필이 없습니다.", 404, "NOT_FOUND");
    }

    // Prisma onDelete:Cascade로 RefereeCertificate/Assignment/Settlement 동반 삭제
    await prisma.referee.delete({ where: { user_id: ctx.userId } });

    return apiSuccess({ has_referee: false });
  } catch {
    return apiError("심판 프로필을 삭제할 수 없습니다.", 500);
  }
});
