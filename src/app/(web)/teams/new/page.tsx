import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { canCreateTeam } from "@/lib/auth/roles";
import { NewTeamForm } from "./new-team-form";

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
