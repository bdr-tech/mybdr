"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";

// 슈퍼관리자 권한 확인 (기존 admin action 패턴 동일)
async function requireSuperAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") throw new Error("권한이 없습니다.");
  return session;
}

// 팀 상태 허용 값: active(활동중) / inactive(비활성)
const VALID_STATUSES = ["active", "inactive"];

// 팀 상태 변경 Server Action
export async function updateTeamStatusAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const teamId = formData.get("team_id") as string;
  const status = formData.get("status") as string;

  if (!teamId || !VALID_STATUSES.includes(status)) return;

  // 이전 상태 조회 (로그 기록용)
  const prev = await prisma.team.findUnique({
    where: { id: BigInt(teamId) },
    select: { status: true, name: true },
  });

  // 상태 업데이트
  await prisma.team.update({
    where: { id: BigInt(teamId) },
    data: { status },
  });

  // 관리자 활동 로그 기록
  await adminLog("team.status_change", "Team", {
    resourceId: teamId,
    description: `팀 상태 변경: ${prev?.name}`,
    previousValues: { status: prev?.status },
    changesMade: { status },
    severity: status === "inactive" ? "warning" : "info",
  });

  revalidatePath("/admin/teams");
}
