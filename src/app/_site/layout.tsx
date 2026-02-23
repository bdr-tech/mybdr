import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

// FR-070, FR-076, FR-077: 토너먼트 사이트 레이아웃 (서브도메인)
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const subdomain = headersList.get("x-tournament-subdomain");

  if (!subdomain) return notFound();

  const site = await prisma.tournamentSite.findUnique({
    where: { subdomain },
    include: {
      tournament: {
        select: { id: true, name: true, format: true, startDate: true, endDate: true },
      },
    },
  });

  if (!site) return notFound();

  if (!site.isPublished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF]">
        <div className="rounded-[16px] bg-[#FFFFFF] p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="mb-4 text-5xl">🏗️</div>
          <h1 className="mb-2 text-xl font-bold">{site.tournament.name}</h1>
          <p className="text-[#6B7280]">사이트 준비 중입니다</p>
        </div>
      </div>
    );
  }

  const primaryColor = site.primaryColor ?? "#F4A261";

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <header className="border-b border-[#E8ECF0] bg-[#FFFFFF]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {site.logoUrl && (
              <img src={site.logoUrl} alt="" className="h-8 w-8 rounded-full" />
            )}
            <span className="font-bold" style={{ color: primaryColor }}>
              {site.site_name ?? site.tournament.name}
            </span>
          </div>
          <nav className="flex gap-4 text-sm text-[#6B7280]">
            <Link href="/" className="hover:text-[#111827]">홈</Link>
            <Link href="/teams" className="hover:text-[#111827]">팀</Link>
            <Link href="/schedule" className="hover:text-[#111827]">일정</Link>
            <Link href="/results" className="hover:text-[#111827]">결과</Link>
            <Link href="/registration" className="hover:text-[#111827]">참가신청</Link>
          </nav>
        </div>
      </header>

      <div
        className="py-12 text-center"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}20, ${site.secondaryColor ?? "#E76F51"}20)`,
        }}
      >
        <h1 className="text-3xl font-bold md:text-4xl" style={{ color: primaryColor }}>
          {site.tournament.name}
        </h1>
        <p className="mt-2 text-[#6B7280]">
          {site.tournament.format}
          {site.tournament.startDate &&
            ` · ${site.tournament.startDate.toLocaleDateString("ko-KR")}`}
          {site.tournament.endDate &&
            ` ~ ${site.tournament.endDate.toLocaleDateString("ko-KR")}`}
        </p>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
