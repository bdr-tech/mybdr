import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { Card, StatCard } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TournamentAdminDashboard() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const organizerId = BigInt(session.sub);

  const [total, active, completed] = await Promise.all([
    prisma.tournament.count({ where: { organizerId } }),
    prisma.tournament.count({ where: { organizerId, status: { in: ["active", "registration"] } } }),
    prisma.tournament.count({ where: { organizerId, status: "completed" } }),
  ]).catch(() => [0, 0, 0]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">대회 관리 대시보드</h1>
        <Link href="/tournament-admin/tournaments/new/wizard" className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white">새 대회 만들기</Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="내 대회" value={total} icon={<span className="text-xl">🏆</span>} />
        <StatCard label="진행 중" value={active} icon={<span className="text-xl">🔥</span>} />
        <StatCard label="완료" value={completed} icon={<span className="text-xl">✅</span>} />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">빠른 시작</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/tournament-admin/tournaments/new/wizard" className="rounded-[16px] bg-[#EEF2FF] p-4 text-center hover:bg-[#E8ECF0] transition-colors">
            <div className="mb-2 text-2xl">🏆</div>
            <p className="text-sm font-medium">대회 만들기</p>
          </Link>
          <Link href="/tournament-admin/tournaments" className="rounded-[16px] bg-[#EEF2FF] p-4 text-center hover:bg-[#E8ECF0] transition-colors">
            <div className="mb-2 text-2xl">📋</div>
            <p className="text-sm font-medium">내 대회 목록</p>
          </Link>
          <Link href="/tournament-admin/templates" className="rounded-[16px] bg-[#EEF2FF] p-4 text-center hover:bg-[#E8ECF0] transition-colors">
            <div className="mb-2 text-2xl">🎨</div>
            <p className="text-sm font-medium">템플릿 둘러보기</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
