import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Rails tournament_admin/matches — 경기/대진표 관리
export default async function TournamentMatchesManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">경기 관리</h1>
        <div className="flex gap-2">
          <Button variant="secondary">대진표 생성</Button>
          <Button>경기 추가</Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          { href: `/tournament-admin/tournaments/${id}/matches/draw`, label: "조 추첨", icon: "🎲" },
          { href: `/tournament-admin/tournaments/${id}/matches/seeds`, label: "시드 배정", icon: "🌱" },
          { href: `/tournament-admin/tournaments/${id}/matches`, label: "일괄 일정", icon: "📅" },
          { href: `/tournament-admin/tournaments/${id}/matches`, label: "자동 배정", icon: "⚡" },
        ].map((a) => (
          <Link key={a.label} href={a.href}>
            <Card className="text-center hover:bg-[#252525] transition-colors cursor-pointer py-4">
              <div className="mb-1 text-xl">{a.icon}</div>
              <p className="text-xs font-medium">{a.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="text-center py-12 text-[#A0A0A0]">
        <div className="mb-2 text-3xl">📋</div>
        경기가 없습니다. 대진표를 생성하세요.
      </Card>
    </div>
  );
}
