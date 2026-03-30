/**
 * PATCH /api/web/admin/ambassadors/[id] — 앰배서더 승인/거절/해임
 *
 * body: { action: "approve" | "reject" | "revoke" }
 *
 * approve: pending → active (임명), appointed_at 설정
 * reject:  pending → revoked (거절)
 * revoke:  active → revoked (해임), revoked_at 설정
 *
 * super_admin만 접근 가능.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: RouteCtx
) {
  // 관리자 인증 필수
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") {
    return apiError("관리자 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id } = await params;
  const ambassadorId = BigInt(id);

  // 요청 본문 파싱
  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  const { action } = body;
  if (!action || !["approve", "reject", "revoke"].includes(action)) {
    return apiError(
      "action은 approve, reject, revoke 중 하나여야 합니다",
      400,
      "INVALID_ACTION"
    );
  }

  // 앰배서더 레코드 조회
  const ambassador = await prisma.court_ambassadors.findUnique({
    where: { id: ambassadorId },
  });
  if (!ambassador) {
    return apiError("존재하지 않는 앰배서더 신청입니다", 404, "NOT_FOUND");
  }

  const now = new Date();

  if (action === "approve") {
    // pending → active 전환
    if (ambassador.status !== "pending") {
      return apiError("대기 중인 신청만 승인할 수 있습니다", 400, "INVALID_STATUS");
    }

    // 같은 코트에 이미 active 앰배서더가 있는지 확인
    const existingActive = await prisma.court_ambassadors.findFirst({
      where: {
        court_info_id: ambassador.court_info_id,
        status: "active",
        id: { not: ambassadorId },
      },
    });
    if (existingActive) {
      return apiError(
        "이 코트에 이미 활동 중인 앰배서더가 있습니다. 먼저 해임해주세요.",
        409,
        "AMBASSADOR_EXISTS"
      );
    }

    await prisma.court_ambassadors.update({
      where: { id: ambassadorId },
      data: { status: "active", appointed_at: now },
    });

    return apiSuccess({ id: ambassadorId.toString(), status: "active" });
  }

  if (action === "reject") {
    // pending → revoked 전환
    if (ambassador.status !== "pending") {
      return apiError("대기 중인 신청만 거절할 수 있습니다", 400, "INVALID_STATUS");
    }

    await prisma.court_ambassadors.update({
      where: { id: ambassadorId },
      data: { status: "revoked", revoked_at: now },
    });

    return apiSuccess({ id: ambassadorId.toString(), status: "revoked" });
  }

  // action === "revoke" → active → revoked 해임
  if (ambassador.status !== "active") {
    return apiError("활동 중인 앰배서더만 해임할 수 있습니다", 400, "INVALID_STATUS");
  }

  await prisma.court_ambassadors.update({
    where: { id: ambassadorId },
    data: { status: "revoked", revoked_at: now },
  });

  return apiSuccess({ id: ambassadorId.toString(), status: "revoked" });
}
