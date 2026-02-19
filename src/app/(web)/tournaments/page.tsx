import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

// FR-030: 토너먼트 목록
export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    where: { status: { not: "draft" } },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      startDate: true,
      _count: { select: { tournamentTeams: true } },
    },
  });

  const statusLabel: Record<string, { label: string; variant: "success" | "default" | "info" | "error" }> = {
    active: { label: "진행 중", variant: "success" },
    completed: { label: "완료", variant: "info" },
    cancelled: { label: "취소", variant: "error" },
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">토너먼트</h1>
        <Link
          href="/tournaments/new"
          className="rounded-full bg-[#F4A261] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E8934E] transition-colors"
        >
          새 토너먼트
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((t) => {
          const st = t.status ?? "draft";
          const s = statusLabel[st] ?? { label: st, variant: "default" as const };
          return (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <Card className="hover:bg-[#252525] transition-colors cursor-pointer">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{t.name}</h3>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
                <p className="text-sm text-[#A0A0A0]">
                  {t.format} · {t._count.tournamentTeams}팀
                </p>
                {t.startDate && (
                  <p className="mt-1 text-xs text-[#666666]">
                    {t.startDate.toLocaleDateString("ko-KR")}
                  </p>
                )}
              </Card>
            </Link>
          );
        })}

        {tournaments.length === 0 && (
          <Card className="col-span-full text-center text-[#A0A0A0]">
            아직 토너먼트가 없습니다.
          </Card>
        )}
      </div>
    </div>
  );
}
