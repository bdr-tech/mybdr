/**
 * GET  /api/web/courts/[id]/ambassador — 현재 앰배서더 조회 (공개)
 * POST /api/web/courts/[id]/ambassador — 앰배서더 신청 (인증 필수)
 *
 * 앰배서더: 코트별 관리 권한자. 위키 수정을 승인 없이 직접 반영하고,
 * 제보를 처리할 수 있다. 한 코트에 한 명만 active 가능.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────
// GET: 현재 코트의 active 앰배서더 + 본인 신청 상태 조회
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

  // 현재 active 앰배서더 조회 (한 코트에 1명)
  const activeAmbassador = await prisma.court_ambassadors.findFirst({
    where: { court_info_id: courtId, status: "active" },
    include: {
      user: { select: { id: true, nickname: true, profile_image_url: true } },
    },
  });

  // 로그인한 유저의 신청 상태도 함께 반환 (UI에서 "이미 신청했는지" 판별)
  const session = await getWebSession();
  let myStatus: string | null = null;
  if (session) {
    const myRecord = await prisma.court_ambassadors.findUnique({
      where: {
        user_id_court_info_id: {
          user_id: BigInt(session.sub),
          court_info_id: courtId,
        },
      },
      select: { status: true },
    });
    myStatus = myRecord?.status ?? null;
  }

  return apiSuccess({
    ambassador: activeAmbassador
      ? {
          id: activeAmbassador.id.toString(),
          userId: activeAmbassador.user_id.toString(),
          nickname: activeAmbassador.user?.nickname ?? "사용자",
          profileImage: activeAmbassador.user?.profile_image_url ?? null,
          appointedAt: activeAmbassador.appointed_at?.toISOString() ?? null,
        }
      : null,
    myStatus, // null | "pending" | "active" | "revoked"
  });
}

// ─────────────────────────────────────────────────
// POST: 앰배서더 신청 (인증 필수)
// ─────────────────────────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: RouteCtx
) {
  // 로그인 필수
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

  // 이미 active 앰배서더가 있으면 신청 불가
  const existing = await prisma.court_ambassadors.findFirst({
    where: { court_info_id: courtId, status: "active" },
  });
  if (existing) {
    return apiError(
      "이미 앰배서더가 활동 중인 코트입니다",
      409,
      "AMBASSADOR_EXISTS"
    );
  }

  // 본인이 이미 신청(pending) 상태인지 확인
  const myRecord = await prisma.court_ambassadors.findUnique({
    where: {
      user_id_court_info_id: { user_id: userId, court_info_id: courtId },
    },
  });

  if (myRecord) {
    if (myRecord.status === "pending") {
      return apiError(
        "이미 신청 중입니다. 관리자 승인을 기다려주세요.",
        409,
        "ALREADY_PENDING"
      );
    }
    if (myRecord.status === "active") {
      return apiError("이미 이 코트의 앰배서더입니다", 409, "ALREADY_ACTIVE");
    }
    // revoked 상태면 다시 pending으로 전환 (재신청)
    await prisma.court_ambassadors.update({
      where: { id: myRecord.id },
      data: { status: "pending", revoked_at: null },
    });
    return apiSuccess({ status: "pending", message: "재신청이 접수되었습니다" }, 200);
  }

  // 새 신청 생성
  await prisma.court_ambassadors.create({
    data: {
      user_id: userId,
      court_info_id: courtId,
      // status: "pending" (기본값)
    },
  });

  return apiSuccess({ status: "pending", message: "앰배서더 신청이 접수되었습니다" }, 201);
}
