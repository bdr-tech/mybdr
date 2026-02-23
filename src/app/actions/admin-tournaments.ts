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

const VALID_STATUSES = ["draft", "active", "registration_open", "registration_closed", "ongoing", "completed", "cancelled"];

export async function updateTournamentStatusAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const tournamentId = formData.get("tournament_id") as string;
  const status = formData.get("status") as string;

  if (!tournamentId || !VALID_STATUSES.includes(status)) return;

  const prev = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true, name: true },
  });

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status },
  });

  await adminLog("tournament.status_change", "Tournament", {
    resourceId: tournamentId,
    description: `대회 상태 변경: ${prev?.name}`,
    previousValues: { status: prev?.status },
    changesMade: { status },
    severity: status === "cancelled" ? "warning" : "info",
  });

  revalidatePath("/admin/tournaments");
}
