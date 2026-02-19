import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// FR-040: 팀 목록
export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      primaryColor: true,
      _count: { select: { teamMembers: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">팀</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
              style={{
                backgroundColor: team.primaryColor
                  ? `${team.primaryColor}20`
                  : "rgba(244,162,97,0.12)",
                color: team.primaryColor ?? "#F4A261",
              }}
            >
              {team.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">{team.name}</h3>
              <p className="text-sm text-[#A0A0A0]">
                {team._count.teamMembers}명
              </p>
            </div>
          </Card>
        ))}

        {teams.length === 0 && (
          <Card className="col-span-full text-center text-[#A0A0A0]">
            등록된 팀이 없습니다.
          </Card>
        )}
      </div>
    </div>
  );
}
