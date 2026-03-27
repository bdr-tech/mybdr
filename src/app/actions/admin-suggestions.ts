"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";

// 슈퍼관리자 권한 확인 (admin-tournaments.ts 패턴 동일)
async function requireSuperAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") throw new Error("권한이 없습니다.");
  return session;
}

// 건의사항에서 허용되는 상태 값
const VALID_STATUSES = ["pending", "open", "in_progress", "resolved"];

// 건의사항 상태 변경 Server Action
export async function updateSuggestionStatusAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const suggestionId = formData.get("suggestion_id") as string;
  const status = formData.get("status") as string;

  if (!suggestionId || !VALID_STATUSES.includes(status)) return;

  // 이전 상태 조회 (로그 기록용)
  const prev = await prisma.suggestions.findUnique({
    where: { id: BigInt(suggestionId) },
    select: { status: true, title: true },
  });

  // 상태 업데이트
  await prisma.suggestions.update({
    where: { id: BigInt(suggestionId) },
    data: { status, updated_at: new Date() },
  });

  // 관리자 활동 로그 기록
  await adminLog("suggestion.status_change", "Suggestion", {
    resourceId: suggestionId,
    description: `건의사항 상태 변경: ${prev?.title}`,
    previousValues: { status: prev?.status },
    changesMade: { status },
  });

  revalidatePath("/admin/suggestions");
}
