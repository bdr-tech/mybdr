"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";
import { MAX_SUPER_ADMINS } from "@/lib/auth/roles";

async function requireSuperAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") {
    throw new Error("권한이 없습니다.");
  }
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  const membershipType = parseInt(formData.get("membership_type") as string, 10);

  if (!userId || isNaN(membershipType) || membershipType < 0 || membershipType > 4) return;

  const prev = await prisma.user.findUnique({ where: { id: BigInt(userId) }, select: { membershipType: true, email: true } });

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { membershipType },
  });

  await adminLog("user.role_change", "User", {
    resourceId: userId,
    description: `${prev?.email ?? userId} 역할 변경`,
    previousValues: { membershipType: prev?.membershipType },
    changesMade: { membershipType },
  });

  revalidatePath("/admin/users");
}

export async function toggleUserAdminAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  const makeAdmin = formData.get("make_admin") === "true";

  if (!userId) return;

  // 슈퍼관리자 최대 4명 제한
  if (makeAdmin) {
    const count = await prisma.user.count({ where: { isAdmin: true } });
    if (count >= MAX_SUPER_ADMINS) {
      redirect(`/admin/users?error=${encodeURIComponent(`슈퍼관리자는 최대 ${MAX_SUPER_ADMINS}명까지 설정할 수 있습니다.`)}`);
    }
  }

  const prev = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { isAdmin: true, email: true },
  });

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { isAdmin: makeAdmin },
  });

  await adminLog("user.admin_change", "User", {
    resourceId: userId,
    description: `${prev?.email ?? userId} 슈퍼관리자 ${makeAdmin ? "지정" : "해제"}`,
    previousValues: { isAdmin: prev?.isAdmin },
    changesMade: { isAdmin: makeAdmin },
    severity: "warning",
  });

  revalidatePath("/admin/users");
}

export async function endPromotionAction(formData: FormData): Promise<{ error?: string }> {
  await requireSuperAdmin();

  const membershipType = parseInt(formData.get("membership_type") as string, 10);
  if (isNaN(membershipType) || membershipType < 1 || membershipType > 3) {
    return { error: "유효하지 않은 플랜입니다." };
  }

  // subscription_expires_at = NULL 인 유저를 만료 처리 (프로모션 무료 → 만료)
  const count = await prisma.user.updateMany({
    where: {
      membershipType,
      subscription_expires_at: null,
    },
    data: {
      subscription_expires_at: new Date(),
    },
  });

  await adminLog("plan.promotion_ended", "Plan", {
    description: `멤버십 ${membershipType} 프로모션 종료 (${count.count}명 만료 처리)`,
    changesMade: { membershipType, affectedCount: count.count },
    severity: "warning",
  });

  revalidatePath("/admin/plans");
  return {};
}

export async function updateUserStatusAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  const status = formData.get("status") as string;

  if (!userId || !["active", "suspended"].includes(status)) return;

  const prev = await prisma.user.findUnique({ where: { id: BigInt(userId) }, select: { status: true, email: true } });

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { status },
  });

  await adminLog("user.status_change", "User", {
    resourceId: userId,
    description: `${prev?.email ?? userId} 상태 변경`,
    previousValues: { status: prev?.status },
    changesMade: { status },
    severity: status === "suspended" ? "warning" : "info",
  });

  revalidatePath("/admin/users");
}
