/**
 * GET /api/web/courts/[id]/reviews — 리뷰 목록 (최신순, 공개)
 * POST /api/web/courts/[id]/reviews — 리뷰 작성 (인증 필수, 중복 방지)
 *
 * POST 비즈니스 로직:
 *   1) 5개 항목 별점(1~5) 평균 → rating 필드에 저장 (기존 호환)
 *   2) @@unique(court_info_id, user_id)로 중복 방지
 *   3) 작성 후 court_infos.average_rating + reviews_count 재계산
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { addXP } from "@/lib/services/gamification";
import { XP_REWARDS } from "@/lib/constants/gamification";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────
// GET: 리뷰 목록 조회 (공개 API)
// ─────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: RouteCtx
) {
  const { id } = await params;
  // ID가 숫자인지 검증 — 문자열이 들어오면 BigInt 변환 시 500 에러 방지
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtId = BigInt(id);

  // 쿼리 파라미터로 페이지네이션 (기본 20개)
  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take") ?? 20), 50);
  const skip = Number(url.searchParams.get("skip") ?? 0);

  const reviews = await prisma.court_reviews.findMany({
    where: { court_info_id: courtId, status: "published" },
    orderBy: { created_at: "desc" },
    take,
    skip,
    include: {
      users: { select: { nickname: true, profile_image_url: true } },
    },
  });

  // BigInt를 string으로 변환하여 JSON 직렬화 가능하게 처리
  const serialized = reviews.map((r) => ({
    id: r.id.toString(),
    userId: r.user_id.toString(),
    nickname: r.users?.nickname ?? "사용자",
    profileImage: r.users?.profile_image_url ?? null,
    rating: r.rating,
    facilityRating: r.facility_rating,
    accessibilityRating: r.accessibility_rating,
    surfaceRating: r.surface_rating,
    lightingRating: r.lighting_rating,
    atmosphereRating: r.atmosphere_rating,
    content: r.content,
    photos: r.photos ?? [],
    createdAt: r.created_at.toISOString(),
  }));

  return apiSuccess({ reviews: serialized, total: serialized.length });
}

// ─────────────────────────────────────────────────
// POST: 리뷰 작성 (인증 필수)
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
    facility_rating?: number;
    accessibility_rating?: number;
    surface_rating?: number;
    lighting_rating?: number;
    atmosphere_rating?: number;
    content?: string;
    photos?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // 5개 항목 별점 검증 (각각 1~5 정수)
  const ratings = [
    body.facility_rating,
    body.accessibility_rating,
    body.surface_rating,
    body.lighting_rating,
    body.atmosphere_rating,
  ];

  // 모든 항목이 입력되었는지 확인
  if (ratings.some((r) => r == null || r < 1 || r > 5 || !Number.isInteger(r))) {
    return apiError("모든 별점 항목을 1~5 사이 정수로 입력해주세요", 400, "INVALID_RATING");
  }

  // 사진 URL 검증 (최대 3장)
  const photos = Array.isArray(body.photos) ? body.photos.slice(0, 3) : [];

  // 5개 항목 평균 계산 → 반올림하여 rating에 저장 (기존 호환)
  const avgRating = Math.round(
    (ratings as number[]).reduce((sum, r) => sum + r, 0) / ratings.length
  );

  // 중복 리뷰 확인 (unique constraint 에러 대신 친절한 메시지)
  const existing = await prisma.court_reviews.findFirst({
    where: { court_info_id: courtId, user_id: userId },
  });
  if (existing) {
    return apiError("이미 이 코트에 리뷰를 작성했습니다", 409, "DUPLICATE_REVIEW");
  }

  // 리뷰 생성
  const now = new Date();
  const review = await prisma.court_reviews.create({
    data: {
      court_info_id: courtId,
      user_id: userId,
      rating: avgRating,
      facility_rating: body.facility_rating!,
      accessibility_rating: body.accessibility_rating!,
      surface_rating: body.surface_rating!,
      lighting_rating: body.lighting_rating!,
      atmosphere_rating: body.atmosphere_rating!,
      content: body.content?.trim() || null,
      photos,
      created_at: now,
      updated_at: now,
    },
    include: {
      users: { select: { nickname: true } },
    },
  });

  // 코트의 average_rating + reviews_count 재계산
  await recalculateCourtRating(courtId);

  // 게이미피케이션: 리뷰 작성 XP 부여
  await addXP(userId, XP_REWARDS.review, "review");

  return apiSuccess(
    {
      id: review.id.toString(),
      rating: review.rating,
      nickname: review.users?.nickname ?? "사용자",
      createdAt: review.created_at.toISOString(),
    },
    201
  );
}

// ─────────────────────────────────────────────────
// 코트 평균 별점 재계산 헬퍼
// - 모든 published 리뷰의 rating 평균을 구해서 court_infos에 업데이트
// ─────────────────────────────────────────────────
export async function recalculateCourtRating(courtId: bigint) {
  const result = await prisma.court_reviews.aggregate({
    where: { court_info_id: courtId, status: "published" },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.court_infos.update({
    where: { id: courtId },
    data: {
      average_rating: result._avg.rating ?? 0,
      reviews_count: result._count.id,
    },
  });
}
