"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";

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
