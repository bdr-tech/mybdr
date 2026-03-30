/**
 * PATCH  /api/web/courts/[id]/events/[eventId] — 이벤트 수정 (주최자만)
 * DELETE /api/web/courts/[id]/events/[eventId] — 이벤트 취소 (주최자만)
 *
 * 주최자만 상태 변경(recruiting→ready→in_progress) 및 취소 가능
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string; eventId: string }> };

// ─────────────────────────────────────────────────
// PATCH: 이벤트 수정 / 상태 변경 (주최자만)
// ─────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: RouteCtx
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { eventId } = await params;
  const userId = BigInt(session.sub);

  // 이벤트 조회 + 권한 확인
  const event = await prisma.court_events.findUnique({
    where: { id: BigInt(eventId) },
    select: { id: true, organizer_id: true, status: true },
  });
  if (!event) {
    return apiError("존재하지 않는 이벤트입니다", 404, "NOT_FOUND");
  }
  if (event.organizer_id !== userId) {
    return apiError("주최자만 수정할 수 있습니다", 403, "FORBIDDEN");
  }

  let body: {
    title?: string;
    description?: string;
    status?: string;       // 상태 전환: recruiting→ready→in_progress→completed
    rules?: string;
    prize?: string;
    start_time?: string;
    end_time?: string;
  };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // 상태 전환 검증: 유효한 전환만 허용
  if (body.status) {
    const validTransitions: Record<string, string[]> = {
      recruiting: ["ready", "cancelled"],
      ready: ["in_progress", "recruiting", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };
    const allowed = validTransitions[event.status] ?? [];
    if (!allowed.includes(body.status)) {
      return apiError(
        `현재 상태(${event.status})에서 ${body.status}로 변경할 수 없습니다`,
        400,
        "INVALID_STATUS_TRANSITION"
      );
    }
  }

  // 업데이트할 데이터 구성
  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title.trim();
  if (body.description !== undefined) updateData.description = body.description.trim() || null;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.rules !== undefined) updateData.rules = body.rules.trim() || null;
  if (body.prize !== undefined) updateData.prize = body.prize.trim() || null;
  if (body.start_time !== undefined) updateData.start_time = body.start_time || null;
  if (body.end_time !== undefined) updateData.end_time = body.end_time || null;

  const updated = await prisma.court_events.update({
    where: { id: BigInt(eventId) },
    data: updateData,
  });

  return apiSuccess({
    id: updated.id.toString(),
    title: updated.title,
    status: updated.status,
  });
}

// ─────────────────────────────────────────────────
// DELETE: 이벤트 취소 (주최자만)
// ─────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: RouteCtx
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { eventId } = await params;
  const userId = BigInt(session.sub);

  // 이벤트 조회 + 권한 확인
  const event = await prisma.court_events.findUnique({
    where: { id: BigInt(eventId) },
    select: { id: true, organizer_id: true, status: true },
  });
  if (!event) {
    return apiError("존재하지 않는 이벤트입니다", 404, "NOT_FOUND");
  }
  if (event.organizer_id !== userId) {
    return apiError("주최자만 취소할 수 있습니다", 403, "FORBIDDEN");
  }
  // 이미 완료/취소된 이벤트는 취소 불가
  if (event.status === "completed" || event.status === "cancelled") {
    return apiError("이미 종료되거나 취소된 이벤트입니다", 400, "ALREADY_ENDED");
  }

  await prisma.court_events.update({
    where: { id: BigInt(eventId) },
    data: { status: "cancelled" },
  });

  return apiSuccess({ message: "이벤트가 취소되었습니다" });
}
