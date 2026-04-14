import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOURNAMENT_STATUS_LABEL, TOURNAMENT_FORMAT_LABEL } from "@/lib/constants/tournament-status";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>내 대회</h1>
        <Link href="/tournament-admin/tournaments/new/wizard" className="rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)]">새 대회</Link>
      </div>

      {tournaments.length > 0 ? (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournament-admin/tournaments/${t.id}`}>
              <Card className="flex items-center justify-between hover:bg-[var(--color-elevated)] transition-colors cursor-pointer">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {t.startDate ? t.startDate.toLocaleDateString("ko-KR") : "날짜 미정"}
                    {t.format && ` · ${TOURNAMENT_FORMAT_LABEL[t.format] ?? t.format}`}
                  </p>
                </div>
                <Badge>{TOURNAMENT_STATUS_LABEL[t.status ?? "draft"] ?? t.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-lg font-semibold text-[var(--color-text-muted)]">No Tournaments</div>
          관리하는 대회가 없습니다.{" "}
          <Link href="/tournament-admin/tournaments/new/wizard" className="text-[var(--color-primary)] hover:underline">새 대회 만들기</Link>
        </Card>
      )}
    </div>
  );
}
