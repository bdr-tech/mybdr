"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

export async function createTeamAction(_prevState: { error: string } | null, formData: FormData) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const primaryColor = (formData.get("primary_color") as string) || "#F4A261";
  const secondaryColor = (formData.get("secondary_color") as string) || "#E76F51";

  if (!name) {
    return { error: "팀 이름은 필수입니다." };
  }

  let createdTeamId: bigint;
  try {
    const userId = BigInt(session.sub);

    const team = await prisma.team.create({
      data: {
        uuid: crypto.randomUUID(),
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
        status: "active",
        joined_at: new Date(),
      },
    });

    createdTeamId = team.id;
  } catch {
    return { error: "팀 생성 중 오류가 발생했습니다." };
  }

  redirect(`/teams/${createdTeamId.toString()}`);
}
