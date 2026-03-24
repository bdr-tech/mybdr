import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "준비중",
  active: "모집중",
  published: "모집중",
  registration: "모집중",
  registration_open: "모집중",
  registration_closed: "접수마감",
  ongoing: "진행중",
  completed: "완료",
  cancelled: "취소",
};

export default async function TournamentAdminTournamentsPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const tournaments = await prisma.tournament.findMany({
    where: { organizerId: BigInt(session.sub) },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">내 대회</h1>
        <Link href="/tournament-admin/tournaments/new/wizard" className="rounded-full bg-[#1B3C87] px-4 py-2 text-sm font-semibold text-white">새 대회</Link>
      </div>

      {tournaments.length > 0 ? (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournament-admin/tournaments/${t.id}`}>
              <Card className="flex items-center justify-between hover:bg-[#EDF0F8] transition-colors cursor-pointer">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-[#6B7280]">
                    {t.startDate ? t.startDate.toLocaleDateString("ko-KR") : "날짜 미정"}
                    {t.format && ` · ${t.format}`}
                  </p>
                </div>
                <Badge>{STATUS_LABEL[t.status ?? "draft"] ?? t.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="py-12 text-center text-[#6B7280]">
          <div className="mb-2 text-3xl">🏆</div>
          관리하는 대회가 없습니다.{" "}
          <Link href="/tournament-admin/tournaments/new/wizard" className="text-[#E31B23] hover:underline">새 대회 만들기</Link>
        </Card>
      )}
    </div>
  );
}
