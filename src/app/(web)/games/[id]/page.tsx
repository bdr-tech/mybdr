import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await prisma.games.findUnique({ where: { id: BigInt(id) } }).catch(() => null);
  if (!game) return notFound();

  const applications = await prisma.game_applications.findMany({
    where: { game_id: game.id },
    include: { users: { select: { nickname: true } } },
  }).catch(() => []);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{game.title}</h1>
          <Badge>{game.status ?? "draft"}</Badge>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between"><span className="text-[#A0A0A0]">장소</span><span>{game.venue_name ?? game.city ?? "-"}</span></div>
          <div className="flex justify-between"><span className="text-[#A0A0A0]">일시</span><span>{game.scheduled_at?.toLocaleString("ko-KR") ?? "-"}</span></div>
          <div className="flex justify-between"><span className="text-[#A0A0A0]">참가비</span><span>{game.fee_per_person ? `${game.fee_per_person.toLocaleString()}원` : "무료"}</span></div>
          <div className="flex justify-between"><span className="text-[#A0A0A0]">최대 인원</span><span>{game.max_participants ?? "제한 없음"}</span></div>
        </div>
        {game.description && <p className="mt-4 text-sm text-[#A0A0A0]">{game.description}</p>}
        <div className="mt-6"><Button className="w-full">참가 신청</Button></div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">참가자 ({applications.length}명)</h2>
        {applications.length > 0 ? (
          <div className="space-y-2">
            {applications.map((a) => (
              <div key={a.id.toString()} className="flex items-center justify-between rounded-[12px] bg-[#252525] px-4 py-2">
                <span className="text-sm">{a.users?.nickname ?? "익명"}</span>
                <Badge variant={a.status === 1 ? "success" : a.status === 2 ? "error" : "default"}>
                  {a.status === 1 ? "승인" : a.status === 2 ? "거부" : "대기"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#A0A0A0]">아직 참가 신청이 없습니다.</p>
        )}
      </Card>
    </div>
  );
}
