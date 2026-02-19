import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id: BigInt(id) },
    include: {
      teamMembers: { include: { user: { select: { nickname: true } } } },
    },
  }).catch(() => null);
  if (!team) return notFound();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold" style={{ backgroundColor: `${team.primaryColor ?? "#F4A261"}20`, color: team.primaryColor ?? "#F4A261" }}>
            {team.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-sm text-[#A0A0A0]">{team.teamMembers.length}명</p>
          </div>
          <Button variant="secondary">가입 신청</Button>
        </div>
        {team.description && <p className="mt-4 text-sm text-[#666666]">{team.description}</p>}
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">멤버</h2>
        <div className="space-y-2">
          {team.teamMembers.map((m) => (
            <div key={m.id.toString()} className="flex items-center justify-between rounded-[12px] bg-[#252525] px-4 py-2">
              <span className="text-sm">{m.user?.nickname ?? "멤버"}</span>
              <Badge variant={m.role === "captain" ? "default" : "success"}>
                {m.role === "captain" ? "주장" : "멤버"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
