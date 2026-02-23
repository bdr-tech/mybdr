import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function TournamentAdminSeriesPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">시리즈</h1>
        <Link href="/tournament-admin/series/new" className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white">시리즈 만들기</Link>
      </div>
      <Card className="text-center py-12 text-[#6B7280]">
        <div className="mb-2 text-3xl">📋</div>
        시리즈가 없습니다.
      </Card>
    </div>
  );
}
