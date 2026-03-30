/**
 * DELETE /api/web/courts/[id]/reviews/[reviewId] — 리뷰 삭제 (본인만)
 *
 * - 본인 리뷰만 삭제 가능
 * - 삭제 후 court_infos.average_rating + reviews_count 재계산
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { recalculateCourtRating } from "../route";

type RouteCtx = { params: Promise<{ id: string; reviewId: string }> };

export async function DELETE(
  _req: NextRequest,
  { params }: RouteCtx
) {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id, reviewId } = await params;
  const courtId = BigInt(id);
  const userId = BigInt(session.sub);

  // 리뷰 존재 + 본인 확인
  const review = await prisma.court_reviews.findFirst({
    where: {
      id: BigInt(reviewId),
      court_info_id: courtId,
    },
  });

  if (!review) {
    return apiError("리뷰를 찾을 수 없습니다", 404, "NOT_FOUND");
  }

  // 본인 리뷰인지 확인 (관리자도 이 API로는 타인 리뷰 삭제 불가)
  if (review.user_id !== userId) {
    return apiError("본인 리뷰만 삭제할 수 있습니다", 403, "FORBIDDEN");
  }

  // 리뷰 삭제
  await prisma.court_reviews.delete({
    where: { id: BigInt(reviewId) },
  });

  // 코트 평균 별점 재계산
  await recalculateCourtRating(courtId);

  return apiSuccess({ deleted: true });
}
