import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SeriesListPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const seriesList = await prisma.tournament_series.findMany({
    where: { organizer_id: BigInt(session.sub) },
    orderBy: { created_at: "desc" },
    include: {
      tournaments: {
        orderBy: { edition_number: "desc" },
        take: 1,
        select: { status: true, edition_number: true },
      },
    },
  }).catch(() => []);

  const STATUS_LABEL: Record<string, string> = {
    registration_open: "모집중",
    registration_closed: "접수마감",
    ongoing: "진행중",
    completed: "완료",
    draft: "준비중",
    cancelled: "취소",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">시리즈</h1>
        <Link
          href="/tournament-admin/series/new"
          className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0052CC] transition-colors"
        >
          새 시리즈 만들기
        </Link>
      </div>

      {seriesList.length > 0 ? (
        <div className="space-y-3">
          {seriesList.map((s) => {
            const latest = s.tournaments[0];
            return (
              <Link key={s.id.toString()} href={`/tournament-admin/series/${s.id}`}>
                <Card className="flex items-center justify-between hover:bg-[#EEF2FF] transition-colors cursor-pointer">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="mt-0.5 text-xs text-[#6B7280]">
                      총 {s.tournaments_count ?? 0}회차
                      {s.description && ` · ${s.description}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {latest && (
                      <Badge>
                        {STATUS_LABEL[latest.status ?? "draft"] ?? latest.status}
                      </Badge>
                    )}
                    <span className="text-xs text-[#9CA3AF]">
                      {latest ? `${latest.edition_number}회차 진행` : "회차 없음"}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="py-16 text-center text-[#6B7280]">
          <div className="mb-3 text-4xl">📋</div>
          <p className="mb-4">아직 시리즈가 없습니다.</p>
          <Link
            href="/tournament-admin/series/new"
            className="inline-block rounded-full bg-[#0066FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0052CC] transition-colors"
          >
            첫 시리즈 만들기
          </Link>
        </Card>
      )}
    </div>
  );
}
