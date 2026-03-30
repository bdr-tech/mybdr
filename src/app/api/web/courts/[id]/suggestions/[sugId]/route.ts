/**
 * PATCH /api/web/courts/[id]/suggestions/[sugId] — 수정 제안 승인/거절 (관리자 전용)
 *
 * 승인 시 트랜잭션으로:
 * 1) court_infos의 해당 필드를 새 값으로 업데이트
 * 2) suggestion.status = "approved"
 * 3) 제안자에게 XP 10 지급
 *
 * 거절 시:
 * 1) suggestion.status = "rejected" + review_note 저장
 * 2) XP 없음
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { addXP } from "@/lib/services/gamification";
import { XP_REWARDS } from "@/lib/constants/gamification";
import { EDITABLE_FIELD_KEYS, type EditableFieldKey } from "@/lib/constants/court";

type RouteCtx = { params: Promise<{ id: string; sugId: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: RouteCtx
) {
  // 관리자 인증 필수
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }
  // super_admin만 승인/거절 가능
  if (session.role !== "super_admin") {
    return apiError("관리자 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id, sugId } = await params;
  const courtId = BigInt(id);
  const suggestionId = BigInt(sugId);
  const reviewerId = BigInt(session.sub);

  // 제안 조회 (pending 상태만)
  const suggestion = await prisma.court_edit_suggestions.findFirst({
    where: { id: suggestionId, court_info_id: courtId, status: "pending" },
  });
  if (!suggestion) {
    return apiError("존재하지 않거나 이미 처리된 제안입니다", 404, "NOT_FOUND");
  }

  // 요청 본문: action("approve" | "reject") + review_note(거절 사유, 선택)
  let body: { action?: string; review_note?: string };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return apiError("action은 approve 또는 reject이어야 합니다", 400, "INVALID_ACTION");
  }

  const now = new Date();
  const reviewNote = body.review_note?.trim() || null;

  if (body.action === "approve") {
    // ─── 승인: 트랜잭션으로 court_infos 업데이트 + 상태 변경 + XP 지급 ───
    await prisma.$transaction(async (tx) => {
      // 1) changes에서 new 값을 추출하여 court_infos 업데이트 데이터 구성
      const changes = suggestion.changes as Record<string, { old: unknown; new: unknown }>;
      const updateData: Record<string, unknown> = {};

      for (const [key, diff] of Object.entries(changes)) {
        // 허용 필드인지 재확인 (안전장치)
        if (EDITABLE_FIELD_KEYS.includes(key as EditableFieldKey)) {
          updateData[key] = diff.new;
        }
      }

      // court_infos 필드 업데이트
      if (Object.keys(updateData).length > 0) {
        await tx.court_infos.update({
          where: { id: courtId },
          data: updateData,
        });
      }

      // 2) 제안 상태를 approved로 변경
      await tx.court_edit_suggestions.update({
        where: { id: suggestionId },
        data: {
          status: "approved",
          reviewed_by: reviewerId,
          reviewed_at: now,
          review_note: reviewNote,
        },
      });

      // 3) 제안자에게 위키 수정 XP 지급
      await addXP(suggestion.user_id, XP_REWARDS.wiki_edit, "wiki_edit");
    });

    return apiSuccess({ id: suggestionId.toString(), status: "approved" });
  } else {
    // ─── 거절: 상태만 변경, XP 없음 ───
    await prisma.court_edit_suggestions.update({
      where: { id: suggestionId },
      data: {
        status: "rejected",
        reviewed_by: reviewerId,
        reviewed_at: now,
        review_note: reviewNote,
      },
    });

    return apiSuccess({ id: suggestionId.toString(), status: "rejected" });
  }
}
