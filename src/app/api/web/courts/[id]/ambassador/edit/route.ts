/**
 * PATCH /api/web/courts/[id]/ambassador/edit — 앰배서더 직접 수정
 *
 * active 앰배서더만 사용 가능. 관리자 승인 없이 코트 정보를 직접 수정한다.
 * 수정 시 data_source를 "ambassador"로 변경하여 출처를 남긴다.
 * 처리할 때마다 ambassador_approve XP (5) 지급.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { addXP } from "@/lib/services/gamification";
import { XP_REWARDS } from "@/lib/constants/gamification";
import { EDITABLE_FIELD_KEYS, EDITABLE_FIELDS, type EditableFieldKey } from "@/lib/constants/court";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: RouteCtx
) {
  // 로그인 필수
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  const courtId = BigInt(id);
  const userId = BigInt(session.sub);

  // 본인이 이 코트의 active 앰배서더인지 확인
  const ambassador = await prisma.court_ambassadors.findFirst({
    where: { court_info_id: courtId, user_id: userId, status: "active" },
  });
  if (!ambassador) {
    return apiError(
      "이 코트의 앰배서더만 직접 수정할 수 있습니다",
      403,
      "NOT_AMBASSADOR"
    );
  }

  // 요청 본문 파싱
  let body: { changes?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  if (!body.changes || typeof body.changes !== "object" || Object.keys(body.changes).length === 0) {
    return apiError("수정할 항목을 1개 이상 선택해주세요", 400, "NO_CHANGES");
  }

  // 허용 필드 검증 (suggestions와 동일한 로직)
  const updateData: Record<string, unknown> = {};

  for (const [key, newValue] of Object.entries(body.changes)) {
    if (!EDITABLE_FIELD_KEYS.includes(key as EditableFieldKey)) {
      return apiError(`수정할 수 없는 필드입니다: ${key}`, 400, "INVALID_FIELD");
    }

    const fieldDef = EDITABLE_FIELDS[key as EditableFieldKey];

    // 타입별 기본 검증
    if (fieldDef.type === "boolean" && typeof newValue !== "boolean") {
      return apiError(`${fieldDef.label}은(는) true/false 값이어야 합니다`, 400, "INVALID_TYPE");
    }
    if (fieldDef.type === "number" && (typeof newValue !== "number" || isNaN(newValue))) {
      return apiError(`${fieldDef.label}은(는) 숫자여야 합니다`, 400, "INVALID_TYPE");
    }
    if (fieldDef.type === "string" && (typeof newValue !== "string" || newValue.trim().length === 0)) {
      return apiError(`${fieldDef.label}을(를) 입력해주세요`, 400, "INVALID_TYPE");
    }

    updateData[key] = newValue;
  }

  // 트랜잭션: 코트 정보 업데이트 + data_source 변경 + XP 지급
  await prisma.$transaction(async (tx) => {
    // 1) 코트 정보 직접 수정 + data_source를 "ambassador"로 변경
    await tx.court_infos.update({
      where: { id: courtId },
      data: {
        ...updateData,
        data_source: "ambassador", // 앰배서더가 수정했다는 출처 표시
        updated_at: new Date(),
      },
    });

    // 2) 앰배서더에게 XP 지급 (제보/위키 처리 보상)
    await addXP(userId, XP_REWARDS.ambassador_approve, "ambassador_edit");
  });

  return apiSuccess({
    message: "코트 정보가 수정되었습니다",
    updatedFields: Object.keys(updateData),
  });
}
