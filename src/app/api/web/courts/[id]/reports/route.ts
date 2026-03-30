/**
 * GET /api/web/courts/[id]/reports — 활성 제보 목록 (공개)
 * POST /api/web/courts/[id]/reports — 제보 작성 (인증 필수)
 *
 * 제보(report)는 코트의 물리적 문제(골대 파손, 바닥 손상 등)를 신고하는 기능.
 * 작성 후 court_infos.reports_count를 재계산한다.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { REPORT_TYPE_KEYS } from "@/lib/constants/court";
import { addXP } from "@/lib/services/gamification";
import { XP_REWARDS } from "@/lib/constants/gamification";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────
// GET: 활성 제보 목록 (공개 API)
// ─────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: RouteCtx
) {
  const { id } = await params;
  // ID가 숫자인지 검증 — 문자열이 들어오면 BigInt 변환 시 500 에러 방지
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtId = BigInt(id);

  // 활성(active) 제보만 조회 (최신순)
  const reports = await prisma.court_reports.findMany({
    where: { court_info_id: courtId, status: "active" },
    orderBy: { created_at: "desc" },
    take: 20,
    include: {
      users: { select: { nickname: true } },
    },
  });

  const serialized = reports.map((r) => ({
    id: r.id.toString(),
    userId: r.user_id.toString(),
    nickname: r.users?.nickname ?? "사용자",
    reportType: r.report_type,
    description: r.description,
    photos: r.photos ?? [],
    status: r.status,
    createdAt: r.created_at.toISOString(),
  }));

  return apiSuccess({ reports: serialized, total: serialized.length });
}

// ─────────────────────────────────────────────────
// POST: 제보 작성 (인증 필수)
// ─────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: RouteCtx
) {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  // ID가 숫자인지 검증
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtId = BigInt(id);
  const userId = BigInt(session.sub);

  // 코트 존재 확인
  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
    select: { id: true },
  });
  if (!court) {
    return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");
  }

  // 요청 본문 파싱
  let body: {
    report_type?: string;
    description?: string;
    photos?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // 제보 유형 검증
  if (!body.report_type || !REPORT_TYPE_KEYS.includes(body.report_type as typeof REPORT_TYPE_KEYS[number])) {
    return apiError(
      `유효하지 않은 제보 유형입니다. 가능한 값: ${REPORT_TYPE_KEYS.join(", ")}`,
      400,
      "INVALID_REPORT_TYPE"
    );
  }

  // 사진 URL (최대 3장)
  const photos = Array.isArray(body.photos) ? body.photos.slice(0, 3) : [];

  // 제보 생성
  const report = await prisma.court_reports.create({
    data: {
      court_info_id: courtId,
      user_id: userId,
      report_type: body.report_type,
      description: body.description?.trim() || null,
      photos,
    },
    include: {
      users: { select: { nickname: true } },
    },
  });

  // 활성 제보 수 재계산
  await recalculateReportsCount(courtId);

  // 게이미피케이션: 제보 작성 XP 부여
  await addXP(userId, XP_REWARDS.report, "report");

  return apiSuccess(
    {
      id: report.id.toString(),
      reportType: report.report_type,
      nickname: report.users?.nickname ?? "사용자",
      createdAt: report.created_at.toISOString(),
    },
    201
  );
}

// ─────────────────────────────────────────────────
// 활성 제보 수 재계산 헬퍼
// ─────────────────────────────────────────────────
export async function recalculateReportsCount(courtId: bigint) {
  const count = await prisma.court_reports.count({
    where: { court_info_id: courtId, status: "active" },
  });

  await prisma.court_infos.update({
    where: { id: courtId },
    data: { reports_count: count },
  });
}
