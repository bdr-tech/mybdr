import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function getDDay(startDate: Date): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const start = new Date(startDate.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "진행중";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  registration: "참가 접수 중",
  active: "진행 중",
  completed: "종료",
  cancelled: "취소",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "text-[#6B7280]",
  registration: "text-[#60A5FA]",
  active: "text-[#4ADE80]",
  completed: "text-[#6B7280]",
  cancelled: "text-[#EF4444]",
};

export default async function TournamentAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      _count: { select: { tournamentTeams: true, tournamentMatches: true } },
      tournamentSite: { select: { subdomain: true, isPublished: true } },
    },
  });

  if (!tournament) notFound();

  // 주최자 또는 관리자 멤버인지 확인
  const isOrganizer = tournament.organizerId === userId;
  if (!isOrganizer) {
    const member = await prisma.tournamentAdminMember.findFirst({
      where: { tournamentId: id, userId, isActive: true },
    });
    if (!member) notFound();
  }

  const status = tournament.status ?? "draft";

  const actions = [
    {
      href: `/tournament-admin/tournaments/${id}/wizard`,
      label: "대회 설정",
      icon: "⚙️",
      desc: "기본 정보, 규칙, 일정 수정",
    },
    {
      href: `/tournament-admin/tournaments/${id}/teams`,
      label: "참가팀 관리",
      icon: "🏀",
      desc: `${tournament._count.tournamentTeams}팀 등록됨`,
    },
    {
      href: `/tournament-admin/tournaments/${id}/bracket`,
      label: "대진표 생성",
      icon: "🏆",
      desc: "자동 생성 · 팀 배치 편집 · 버전 관리",
    },
    {
      href: `/tournament-admin/tournaments/${id}/matches`,
      label: "경기 관리",
      icon: "📋",
      desc: `${tournament._count.tournamentMatches}경기 · 스코어 입력`,
    },
    {
      href: `/tournament-admin/tournaments/${id}/site`,
      label: "사이트 관리",
      icon: "🌐",
      desc: tournament.tournamentSite[0]
        ? `${tournament.tournamentSite[0].subdomain}.mybdr.kr`
        : "사이트 미설정",
    },
    {
      href: `/tournament-admin/tournaments/${id}/admins`,
      label: "관리자",
      icon: "👥",
      desc: "스태프 권한 관리",
    },
    {
      href: `/tournament-admin/tournaments/${id}/recorders`,
      label: "기록원",
      icon: "📋",
      desc: "스탯 기록원 지정",
    },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link href="/tournament-admin/tournaments" className="text-sm text-[#6B7280] hover:text-[#111827]">
                ← 대회 목록
              </Link>
            </div>
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              <span className={STATUS_COLOR[status] ?? "text-[#6B7280]"}>
                ● {STATUS_LABEL[status] ?? status}
              </span>
              {tournament.startDate && (
                <>
                  <span className="text-[#6B7280]">
                    {tournament.startDate.toLocaleDateString("ko-KR")}
                    {tournament.endDate && ` ~ ${tournament.endDate.toLocaleDateString("ko-KR")}`}
                  </span>
                  <span className="rounded-full bg-[rgba(244,162,97,0.12)] px-2 py-0.5 text-xs font-semibold text-[#F4A261]">
                    {getDDay(tournament.startDate)}
                  </span>
                </>
              )}
              <span className="text-[#6B7280]">{tournament.format ?? "싱글 엘리미네이션"}</span>
            </div>
          </div>
          {tournament.tournamentSite[0]?.isPublished && (
            <Badge>공개 중</Badge>
          )}
        </div>
      </div>

      {/* 빠른 통계 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "참가팀", value: tournament._count.tournamentTeams },
          { label: "최대팀", value: tournament.maxTeams ?? 16 },
          { label: "경기 수", value: tournament._count.tournamentMatches },
          { label: "참가비", value: tournament.entry_fee ? `${Number(tournament.entry_fee).toLocaleString()}원` : "무료" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            <p className="text-2xl font-bold text-[#F4A261]">{s.value}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* 액션 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="cursor-pointer transition-colors hover:bg-[#EEF2FF]">
              <div className="mb-2 text-2xl">{a.icon}</div>
              <h3 className="font-semibold">{a.label}</h3>
              <p className="mt-1 text-sm text-[#6B7280]">{a.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
