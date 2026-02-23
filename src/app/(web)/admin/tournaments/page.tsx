import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "준비중",
  active: "모집중",
  published: "모집중",
  registration_open: "모집중",
  registration_closed: "접수마감",
  ongoing: "진행중",
  completed: "완료",
  cancelled: "취소",
};

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

// FR-062: 토너먼트 관리 (Admin)
export default async function AdminTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      _count: { select: { tournamentTeams: true, tournamentMatches: true } },
    },
  });

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
      draft: "warning",
      active: "success",
      completed: "info",
      cancelled: "error",
    };
    return map[status] ?? "default";
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">토너먼트 관리</h1>
        <span className="text-sm text-[#6B7280]">{tournaments.length}개</span>
      </div>

      <div className="grid gap-4">
        {tournaments.map((t) => (
          <Card key={t.id} className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{t.name}</h3>
                <Badge variant={statusBadge(t.status ?? "draft")}>{STATUS_LABEL[t.status ?? "draft"] ?? t.status ?? "draft"}</Badge>
              </div>
              <p className="mt-1 text-sm text-[#6B7280]">
                {FORMAT_LABEL[t.format ?? ""] ?? t.format ?? ""} · {t._count.tournamentTeams}팀 · {t._count.tournamentMatches}경기
                {t.startDate && ` · ${t.startDate.toLocaleDateString("ko-KR")}`}
              </p>
            </div>
          </Card>
        ))}

        {tournaments.length === 0 && (
          <Card className="text-center text-[#6B7280]">
            등록된 토너먼트가 없습니다.
          </Card>
        )}
      </div>
    </div>
  );
}
