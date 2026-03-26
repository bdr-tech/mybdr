import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { canCreateTeam } from "@/lib/auth/roles";
import { NewTeamForm } from "./new-team-form";

// SEO: 팀 생성 페이지 메타데이터
export const metadata: Metadata = {
  title: "팀 만들기 | MyBDR",
  description: "나만의 농구 팀을 만들고 팀원을 모집하세요.",
};

export default async function NewTeamPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  if (session.role !== "super_admin") {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.sub) },
      select: { membershipType: true },
    });
    if (!canCreateTeam(user?.membershipType ?? 0)) {
      redirect("/upgrade?reason=team_creation");
    }
  }

  return <NewTeamForm />;
}
