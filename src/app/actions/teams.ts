"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { canCreateTeam } from "@/lib/auth/roles";

export async function createTeamAction(_prevState: { error: string } | null, formData: FormData) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const primaryColor = (formData.get("primary_color") as string) || "#E31B23";
  const secondaryColor = (formData.get("secondary_color") as string) || "#E76F51";

  if (!name) {
    return { error: "팀 이름은 필수입니다." };
  }

  let createdTeamId: bigint;
  try {
    const userId = BigInt(session.sub);

    // 권한 체크 (슈퍼관리자 우회, 나머지는 membershipType 기반)
    if (session.role !== "super_admin") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { membershipType: true },
      });
      if (!canCreateTeam(user?.membershipType ?? 0)) {
        return { error: "UPGRADE_REQUIRED" };
      }
    }

    // 팀 2개 한도 확인
    const teamCount = await prisma.team.count({ where: { captainId: userId } });
    if (teamCount >= 2) {
      return { error: "팀은 최대 2개까지 생성할 수 있습니다." };
    }

    const team = await prisma.team.create({
      data: {
        uuid: randomUUID(),
        name,
        description: description || null,
        primaryColor,
        secondaryColor,
        captainId: userId,
        status: "active",
        members_count: 1,
      },
    });

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: "captain",
        status: "approved",
        joined_at: new Date(),
      },
    });

    createdTeamId = team.id;
  } catch (e) {
    console.error("[createTeamAction]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `팀 생성 중 오류가 발생했습니다. (${msg.slice(0, 100)})` };
  }

  redirect(`/teams/${createdTeamId.toString()}`);
}
