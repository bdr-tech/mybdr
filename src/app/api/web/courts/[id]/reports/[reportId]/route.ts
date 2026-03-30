/**
 * PATCH /api/web/courts/[id]/reports/[reportId] — 제보 상태 변경 (관리자 전용)
 *
 * - status: "resolved" | "dismissed"
 * - resolved_at + resolved_by 자동 기록
 * - 상태 변경 후 court_infos.reports_count 재계산
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { recalculateReportsCount } from "../route";

type RouteCtx = { params: Promise<{ id: string; reportId: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: RouteCtx
) {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  // 관리자 권한 확인
  if (session.role !== "admin") {
    return apiError("관리자 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id, reportId } = await params;
  const courtId = BigInt(id);
  const adminUserId = BigInt(session.sub);

  // 요청 본문 파싱
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // 허용 상태값 검증
  const allowedStatuses = ["resolved", "dismissed"];
  if (!body.status || !allowedStatuses.includes(body.status)) {
    return apiError(
      `유효하지 않은 상태입니다. 가능한 값: ${allowedStatuses.join(", ")}`,
      400,
      "INVALID_STATUS"
    );
  }

  // 제보 존재 확인
  const report = await prisma.court_reports.findFirst({
    where: { id: BigInt(reportId), court_info_id: courtId },
  });
  if (!report) {
    return apiError("제보를 찾을 수 없습니다", 404, "NOT_FOUND");
  }

  // 이미 처리된 제보인지 확인
  if (report.status !== "active") {
    return apiError("이미 처리된 제보입니다", 400, "ALREADY_PROCESSED");
  }

  // 상태 변경
  const updated = await prisma.court_reports.update({
    where: { id: BigInt(reportId) },
    data: {
      status: body.status,
      resolved_at: new Date(),
      resolved_by: adminUserId,
    },
  });

  // 활성 제보 수 재계산
  await recalculateReportsCount(courtId);

  return apiSuccess({
    id: updated.id.toString(),
    status: updated.status,
    resolvedAt: updated.resolved_at?.toISOString() ?? null,
  });
}
