import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

// 서브도메인 사이트 레이아웃 — 발행 게이트만 담당, 크롬은 각 템플릿이 처리
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const subdomain = headersList.get("x-tournament-subdomain");
  if (!subdomain) return notFound();

  const site = await prisma.tournamentSite.findFirst({
    where: { subdomain },
    select: {
      isPublished: true,
      site_name: true,
      tournament: { select: { name: true } },
    },
  });

  if (!site) return notFound();

  if (!site.isPublished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-2xl bg-white p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="mb-4 text-5xl">🏗️</div>
          <h1 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
            {site.site_name ?? site.tournament.name}
          </h1>
          <p className="text-[var(--color-text-muted)]">사이트 준비 중입니다</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
