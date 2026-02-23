"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";

async function requireSuperAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") throw new Error("권한이 없습니다.");
  return session;
}

export async function clearCacheAction(): Promise<{ ok: boolean; message: string }> {
  await requireSuperAdmin();

  // 전체 사이트 캐시 무효화
  revalidatePath("/", "layout");

  await adminLog("settings.cache_clear", "System", {
    description: "전체 사이트 캐시 초기화",
  });

  return { ok: true, message: "캐시가 초기화되었습니다." };
}

export async function toggleMaintenanceModeAction(): Promise<{ ok: boolean; enabled: boolean }> {
  await requireSuperAdmin();

  const current = await prisma.site_settings.findUnique({ where: { key: "maintenance_mode" } });
  const currentValue = current?.value === "true";
  const newValue = !currentValue;

  await prisma.site_settings.upsert({
    where: { key: "maintenance_mode" },
    create: { key: "maintenance_mode", value: String(newValue) },
    update: { value: String(newValue) },
  });

  await adminLog("settings.maintenance_toggle", "System", {
    description: `점검모드 ${newValue ? "활성화" : "비활성화"}`,
    previousValues: { maintenance_mode: currentValue },
    changesMade: { maintenance_mode: newValue },
    severity: newValue ? "warning" : "info",
  });

  revalidatePath("/admin/settings");
  return { ok: true, enabled: newValue };
}
