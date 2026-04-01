import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";

// ---------------------------------------------------------------------------
// DELETE /api/v1/duo/pair/[pin] — 호스트가 세션 종료
// ---------------------------------------------------------------------------
async function handleDelete(
  _req: NextRequest,
  ctx: { userId: string; userRole: string },
  pin: string
) {
  const hostUserId = BigInt(ctx.userId);

  // 세션 조회
  const session = await prisma.duoSession.findUnique({ where: { pin } });
  if (!session) return apiError("세션을 찾을 수 없습니다", 404, "NOT_FOUND");

  // 호스트만 종료 가능
  if (session.hostUserId !== hostUserId) {
    return apiError("세션 종료 권한이 없습니다", 403, "FORBIDDEN");
  }

  // 이미 종료된 세션
  if (session.status === "closed") {
    return apiSuccess({ message: "이미 종료된 세션입니다" });
  }

  // 세션 종료
  await prisma.duoSession.update({
    where: { id: session.id },
    data: { status: "closed" },
  });

  return apiSuccess({ message: "세션이 종료되었습니다" });
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------
type RouteContext = { params: Promise<{ pin: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { pin } = await context.params;

  return withErrorHandler(
    withAuth((r, ctx) => handleDelete(r, ctx, pin))
  )(req);
}
