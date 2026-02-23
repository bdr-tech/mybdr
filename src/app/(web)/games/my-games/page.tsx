import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<number, string> = { 0: "대기", 1: "모집중", 2: "마감", 3: "진행중", 4: "완료", 5: "취소" };
const APP_STATUS: Record<number, string> = { 0: "신청 중", 1: "승인", 2: "거부" };

export default async function MyGamesPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);

  // 내가 만든 경기
  const hostedGames = await prisma.games.findMany({
    where: { organizer_id: userId },
    orderBy: { scheduled_at: "desc" },
    take: 10,
  }).catch(() => []);

  // 내가 신청한 경기
  const applications = await prisma.game_applications.findMany({
    where: { user_id: userId },
    include: { games: { select: { id: true, uuid: true, title: true, scheduled_at: true, venue_name: true, status: true } } },
    orderBy: { created_at: "desc" },
    take: 10,
  }).catch(() => []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">내 경기</h1>

      {/* 내가 만든 경기 */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">내가 만든 경기</h2>
        {hostedGames.length > 0 ? (
          <div className="space-y-2">
            {hostedGames.map((g) => (
              <Link key={g.id.toString()} href={`/games/${g.uuid ?? g.id}`}>
                <Card className="flex items-center justify-between hover:bg-[#EEF2FF] transition-colors">
                  <div>
                    <p className="font-medium">{g.title ?? "제목 없음"}</p>
                    <p className="text-xs text-[#6B7280]">{g.scheduled_at?.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · {g.venue_name ?? g.city ?? "-"}</p>
                  </div>
                  <Badge>{STATUS_LABEL[g.status] ?? "대기"}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center text-[#6B7280]">
            <div className="mb-2 text-3xl">🏀</div>
            만든 경기가 없습니다.{" "}
            <Link href="/games/new" className="text-[#F4A261] hover:underline">경기 만들기</Link>
          </Card>
        )}
      </div>

      {/* 참가 신청한 경기 */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">참가 신청한 경기</h2>
        {applications.length > 0 ? (
          <div className="space-y-2">
            {applications.map((a) => (
              <Link key={a.id.toString()} href={`/games/${a.games?.uuid ?? a.game_id}`}>
                <Card className="flex items-center justify-between hover:bg-[#EEF2FF] transition-colors">
                  <div>
                    <p className="font-medium">{a.games?.title ?? "경기"}</p>
                    <p className="text-xs text-[#6B7280]">{a.games?.scheduled_at?.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · {a.games?.venue_name ?? "-"}</p>
                  </div>
                  <Badge variant={a.status === 1 ? "success" : a.status === 2 ? "error" : "default"}>
                    {APP_STATUS[a.status] ?? "대기"}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center text-[#6B7280]">
            <div className="mb-2 text-3xl">🏀</div>
            참가 신청한 경기가 없습니다.
          </Card>
        )}
      </div>
    </div>
  );
}
