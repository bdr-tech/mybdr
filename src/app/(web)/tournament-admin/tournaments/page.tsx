import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TournamentAdminTournamentsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 대회</h1>
        <Link href="/tournament-admin/tournaments/new" className="rounded-full bg-[#F4A261] px-4 py-2 text-sm font-semibold text-[#0A0A0A]">새 대회</Link>
      </div>
      <Card className="text-center py-12 text-[#A0A0A0]">
        <div className="mb-2 text-3xl">🏆</div>
        관리하는 대회가 없습니다. 새 대회를 만들어보세요.
      </Card>
    </div>
  );
}
