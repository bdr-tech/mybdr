"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

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

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { membershipType },
  });

  revalidatePath("/admin/users");
}

export async function updateUserStatusAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = formData.get("user_id") as string;
  const status = formData.get("status") as string;

  if (!userId || !["active", "suspended"].includes(status)) return;

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { status },
  });

  revalidatePath("/admin/users");
}
