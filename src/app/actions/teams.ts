"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { canCreateTeam } from "@/lib/auth/roles";
// Phase 2A-2: Zod로 영문명/대표 언어까지 한번에 검증
import { createTeamSchema } from "@/lib/validation/team";

export async function createTeamAction(_prevState: { error: string } | null, formData: FormData) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  // 폼 필드 추출 — FormData는 항상 string | File이라서 string으로 캐스팅
  const rawName = (formData.get("name") as string | null) ?? "";
  const rawDescription = (formData.get("description") as string | null) ?? "";
  const rawNameEn = formData.get("name_en") as string | null; // 없으면 null
  const rawNamePrimary = (formData.get("name_primary") as string | null) ?? "ko";
  const primaryColor = (formData.get("primary_color") as string) || "#E31B23";
  const secondaryColor = (formData.get("secondary_color") as string) || "#E76F51";

  // Zod 검증 — 한글명 필수 + 영문명 엄격 규칙 + 대표언어 enum
  const parsed = createTeamSchema.safeParse({
    name: rawName,
    name_en: rawNameEn, // nameEnSchema가 빈 문자열을 null로 변환
    name_primary: rawNamePrimary,
    description: rawDescription || null,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
  });

  if (!parsed.success) {
    // 첫 번째 에러 메시지만 사용자에게 노출 (바이브 코더 친화)
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "입력값이 올바르지 않습니다." };
  }

  const { name, name_en, name_primary, description } = parsed.data;

  let createdTeamId: bigint;
  try {
    const userId = BigInt(session.sub);

    // 팀 한도 확인 (super_admin은 무제한)
    if (session.role !== "super_admin") {
      const teamCount = await prisma.team.count({ where: { captainId: userId } });
      if (teamCount >= 5) {
        return { error: "팀은 최대 5개까지 생성할 수 있습니다." };
      }
    }

    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          uuid: randomUUID(),
          name,
          // Phase 2A-2: 영문명/대표언어 신규 필드 — 없으면 null / "ko"
          name_en: name_en ?? null,
          name_primary: name_primary ?? "ko",
          description: description || null,
          primaryColor,
          secondaryColor,
          captainId: userId,
          status: "active",
          members_count: 1,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: created.id,
          userId,
          role: "captain",
          status: "active",
          joined_at: new Date(),
        },
      });

      return created;
    });

    createdTeamId = team.id;
  } catch (e) {
    console.error("[createTeamAction]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `팀 생성 중 오류가 발생했습니다. (${msg.slice(0, 100)})` };
  }

  redirect(`/teams/${createdTeamId.toString()}`);
}
