import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const revalidate = 300;

export default async function TournamentSeriesPage() {
  const series = await prisma.tournament_series.findMany({
    orderBy: { created_at: "desc" },
    take: 20,
  }).catch(() => []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">시리즈</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s) => (
          <Link key={s.id.toString()} href={`/tournament-series/${s.id}`}>
            <Card className="hover:bg-[#EEF2FF] transition-colors cursor-pointer">
              <h3 className="font-semibold">{s.name}</h3>
              {s.description && <p className="mt-1 text-sm text-[#6B7280]">{s.description}</p>}
            </Card>
          </Link>
        ))}
        {series.length === 0 && <Card className="col-span-full text-center text-[#6B7280]">시리즈가 없습니다.</Card>}
      </div>
    </div>
  );
}
