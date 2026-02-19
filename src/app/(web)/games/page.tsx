import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const games = await prisma.games.findMany({
    orderBy: { scheduled_at: "desc" },
    take: 30,
  }).catch(() => []);

  // games.status: 0=draft, 1=published, 2=confirmed, 3=completed, 4=cancelled
  const statusMap: Record<number, { label: string; variant: "success" | "default" | "error" | "warning" | "info" }> = {
    0: { label: "임시", variant: "warning" },
    1: { label: "모집 중", variant: "success" },
    2: { label: "확정", variant: "info" },
    3: { label: "완료", variant: "default" },
    4: { label: "취소", variant: "error" },
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">경기</h1>
        <div className="flex gap-2">
          <Link href="/games/my-games" className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-[#A0A0A0] hover:text-white">내 경기</Link>
          <Link href="/games/new" className="rounded-full bg-[#F4A261] px-4 py-2 text-sm font-semibold text-[#0A0A0A]">경기 만들기</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => {
          const s = statusMap[g.status] ?? { label: String(g.status), variant: "default" as const };
          return (
            <Link key={g.id.toString()} href={`/games/${g.id}`}>
              <Card className="hover:bg-[#252525] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{g.title}</h3>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-[#A0A0A0]">{g.venue_name ?? g.city ?? "-"}</p>
                <p className="mt-1 text-xs text-[#666666]">
                  {g.scheduled_at?.toLocaleDateString("ko-KR")}
                  {g.max_participants && ` · 최대 ${g.max_participants}명`}
                </p>
              </Card>
            </Link>
          );
        })}
        {games.length === 0 && (
          <Card className="col-span-full text-center text-[#A0A0A0] py-12">
            <div className="mb-2 text-3xl">🏀</div>등록된 경기가 없습니다.
          </Card>
        )}
      </div>
    </div>
  );
}
