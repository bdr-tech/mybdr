import { Card, StatCard } from "@/components/ui/card";
import Link from "next/link";

// Rails tournament_admin/dashboard#index
export default function TournamentAdminDashboard() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">대회 관리 대시보드</h1>
        <Link href="/tournament-admin/tournaments/new" className="rounded-full bg-[#F4A261] px-4 py-2 text-sm font-semibold text-[#0A0A0A]">새 대회 만들기</Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="내 대회" value={0} icon={<span className="text-xl">🏆</span>} />
        <StatCard label="진행 중" value={0} icon={<span className="text-xl">🔥</span>} />
        <StatCard label="완료" value={0} icon={<span className="text-xl">✅</span>} />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">빠른 시작</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/tournament-admin/tournaments/new" className="rounded-[16px] bg-[#252525] p-4 text-center hover:bg-[#2A2A2A] transition-colors">
            <div className="mb-2 text-2xl">🏆</div>
            <p className="text-sm font-medium">대회 만들기</p>
          </Link>
          <Link href="/tournament-admin/series/new" className="rounded-[16px] bg-[#252525] p-4 text-center hover:bg-[#2A2A2A] transition-colors">
            <div className="mb-2 text-2xl">📋</div>
            <p className="text-sm font-medium">시리즈 만들기</p>
          </Link>
          <Link href="/tournament-admin/templates" className="rounded-[16px] bg-[#252525] p-4 text-center hover:bg-[#2A2A2A] transition-colors">
            <div className="mb-2 text-2xl">🎨</div>
            <p className="text-sm font-medium">템플릿 둘러보기</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
