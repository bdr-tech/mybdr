import Link from "next/link";
import { Card } from "@/components/ui/card";

// Rails tournament_admin/tournaments#show — 대회 관리 메인
export default async function TournamentAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const actions = [
    { href: `/tournament-admin/tournaments/${id}/wizard`, label: "위자드", icon: "🧙", desc: "단계별 대회 설정" },
    { href: `/tournament-admin/tournaments/${id}/matches`, label: "경기 관리", icon: "📋", desc: "대진표, 일정, 결과" },
    { href: `/tournament-admin/tournaments/${id}/site`, label: "사이트 관리", icon: "🌐", desc: "대회 전용 웹사이트" },
    { href: `/tournament-admin/tournaments/${id}/admins`, label: "관리자", icon: "👥", desc: "스태프 관리" },
    { href: `/tournament-admin/tournaments/${id}/edit`, label: "설정", icon: "⚙️", desc: "대회 정보 수정" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">대회 관리</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="hover:bg-[#252525] transition-colors cursor-pointer">
              <div className="mb-2 text-2xl">{a.icon}</div>
              <h3 className="font-semibold">{a.label}</h3>
              <p className="mt-1 text-sm text-[#A0A0A0]">{a.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
