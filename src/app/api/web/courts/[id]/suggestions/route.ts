/**
 * GET /api/web/courts/[id]/suggestions — 수정 제안 목록 (공개)
 * POST /api/web/courts/[id]/suggestions — 수정 제안 작성 (인증 필수)
 *
 * 위키 수정 제안: 사용자가 코트 정보(바닥재, 조명 등)를 보정/추가 제안.
 * court_reports(물리적 문제 신고)와 완전 분리.
 */
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { EDITABLE_FIELD_KEYS, EDITABLE_FIELDS, type EditableFieldKey } from "@/lib/constants/court";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────
// GET: 수정 제안 목록 (모든 상태, 최신순 20건)
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

  // 최신순 20건 조회 (pending 우선, 그 다음 최신순)
  const suggestions = await prisma.court_edit_suggestions.findMany({
    where: { court_info_id: courtId },
    orderBy: [{ status: "asc" }, { created_at: "desc" }],
    take: 20,
    include: {
      users: { select: { nickname: true } },
      reviewer: { select: { nickname: true } },
    },
  });

  // BigInt → string 직렬화
  const serialized = suggestions.map((s) => ({
    id: s.id.toString(),
    userId: s.user_id.toString(),
    nickname: s.users?.nickname ?? "사용자",
    changes: s.changes,
    reason: s.reason,
    status: s.status,
    reviewedBy: s.reviewed_by?.toString() ?? null,
    reviewerNickname: s.reviewer?.nickname ?? null,
    reviewNote: s.review_note,
    reviewedAt: s.reviewed_at?.toISOString() ?? null,
    createdAt: s.created_at.toISOString(),
  }));

  return apiSuccess({ suggestions: serialized, total: serialized.length });
}

// ─────────────────────────────────────────────────
// POST: 수정 제안 작성 (인증 필수)
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

  // 코트 존재 확인 + 현재 값 조회 (old 값 채우기용)
  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
  });
  if (!court) {
    return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");
  }

  // 같은 코트에 같은 유저의 pending 제안이 있으면 차단 (중복 방지)
  const existingPending = await prisma.court_edit_suggestions.findFirst({
    where: { court_info_id: courtId, user_id: userId, status: "pending" },
  });
  if (existingPending) {
    return apiError(
      "이미 대기 중인 수정 제안이 있습니다. 심사가 완료된 후 다시 제안해주세요.",
      409,
      "DUPLICATE_PENDING"
    );
  }

  // 요청 본문 파싱
  let body: { changes?: Record<string, unknown>; reason?: string };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // 사유 필수 검증
  const reason = body.reason?.trim();
  if (!reason || reason.length < 2) {
    return apiError("수정 사유를 2자 이상 입력해주세요", 400, "REASON_REQUIRED");
  }
  if (reason.length > 200) {
    return apiError("수정 사유는 200자 이내로 입력해주세요", 400, "REASON_TOO_LONG");
  }

  // changes 필드 검증: { fieldKey: newValue } 형태로 받아서 { fieldKey: { old, new } } 로 변환
  if (!body.changes || typeof body.changes !== "object" || Object.keys(body.changes).length === 0) {
    return apiError("수정할 항목을 1개 이상 선택해주세요", 400, "NO_CHANGES");
  }

  const validatedChanges: Record<string, { old: unknown; new: unknown }> = {};

  for (const [key, newValue] of Object.entries(body.changes)) {
    // 허용된 필드인지 확인
    if (!EDITABLE_FIELD_KEYS.includes(key as EditableFieldKey)) {
      return apiError(`수정할 수 없는 필드입니다: ${key}`, 400, "INVALID_FIELD");
    }

    const fieldDef = EDITABLE_FIELDS[key as EditableFieldKey];

    // 타입별 검증
    if (fieldDef.type === "boolean" && typeof newValue !== "boolean") {
      return apiError(`${fieldDef.label}은(는) true/false 값이어야 합니다`, 400, "INVALID_TYPE");
    }
    if (fieldDef.type === "number") {
      if (typeof newValue !== "number" || isNaN(newValue)) {
        return apiError(`${fieldDef.label}은(는) 숫자여야 합니다`, 400, "INVALID_TYPE");
      }
      // min/max 체크 (number 타입 필드에만 존재)
      const numDef = fieldDef as { min?: number; max?: number };
      if (numDef.min !== undefined && newValue < numDef.min) {
        return apiError(`${fieldDef.label} 최솟값은 ${numDef.min}입니다`, 400, "OUT_OF_RANGE");
      }
      if (numDef.max !== undefined && newValue > numDef.max) {
        return apiError(`${fieldDef.label} 최댓값은 ${numDef.max}입니다`, 400, "OUT_OF_RANGE");
      }
    }
    if (fieldDef.type === "string") {
      if (typeof newValue !== "string" || newValue.trim().length === 0) {
        return apiError(`${fieldDef.label}을(를) 입력해주세요`, 400, "INVALID_TYPE");
      }
      // maxLength 체크 (string 타입 필드 중 text/textarea에만 존재)
      const strDef = fieldDef as { maxLength?: number };
      if (strDef.maxLength && newValue.length > strDef.maxLength) {
        return apiError(`${fieldDef.label}은(는) ${strDef.maxLength}자 이내로 입력해주세요`, 400, "TOO_LONG");
      }
      // select 필드라면 옵션 검증
      const selectDef = fieldDef as { input: string; options?: { value: string }[] };
      if (selectDef.input === "select" && selectDef.options) {
        const validValues = selectDef.options.map((o) => o.value);
        if (!validValues.includes(newValue)) {
          return apiError(`${fieldDef.label}의 유효하지 않은 값입니다`, 400, "INVALID_OPTION");
        }
      }
    }

    // 현재 DB 값(old)과 새 값(new)을 짝지어 저장
    const oldValue = (court as Record<string, unknown>)[key] ?? null;
    validatedChanges[key] = { old: oldValue, new: newValue };
  }

  // DB에 제안 생성
  const suggestion = await prisma.court_edit_suggestions.create({
    data: {
      court_info_id: courtId,
      user_id: userId,
      changes: validatedChanges as unknown as Prisma.InputJsonValue,
      reason,
    },
  });

  // 작성자 닉네임 조회 (create와 분리 — Prisma 타입 호환성)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true },
  });

  return apiSuccess(
    {
      id: suggestion.id.toString(),
      nickname: user?.nickname ?? "사용자",
      changes: suggestion.changes,
      reason: suggestion.reason,
      status: suggestion.status,
      createdAt: suggestion.created_at.toISOString(),
    },
    201
  );
}
