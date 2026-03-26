import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { canHostPickup, canCreateTeam } from "@/lib/auth/roles";
import { NewGameForm } from "./new-game-form";

// SEO: 경기 생성 페이지 메타데이터
export const metadata: Metadata = {
  title: "경기 만들기 | MyBDR",
  description: "새로운 픽업 게임이나 팀 대결을 생성하세요.",
};

export default async function NewGamePage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: BigInt(session.sub) },
    select: { membershipType: true, isAdmin: true },
  });

  const mt = user?.membershipType ?? 0;
  const isAdmin = user?.isAdmin ?? false;

  const permissions = {
    canCreatePickup: isAdmin || canHostPickup(mt),
    canCreateTeamMatch: isAdmin || canCreateTeam(mt),
  };

  return <NewGameForm permissions={permissions} />;
}
