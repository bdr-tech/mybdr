import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ClassicTemplate } from "@/components/site-templates/classic";

type Props = { params: Promise<{ path?: string[] }> };

const DARK_SLUGS = new Set(["the-process", "street-ball", "corporate-league"]);
const MINIMAL_SLUGS = new Set(["minimal-white"]);

export default async function SitePage({ params }: Props) {
  const { path } = await params;
  const currentPage = path?.[0] ?? "home";

  const headersList = await headers();
  const subdomain = headersList.get("x-tournament-subdomain");
  if (!subdomain) return notFound();

  const site = await prisma.tournamentSite.findFirst({
    where: { subdomain },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          format: true,
          startDate: true,
          endDate: true,
          status: true,
          maxTeams: true,
          entry_fee: true,
          venue_name: true,
        },
      },
      siteTemplate: { select: { slug: true, name: true } },
      site_pages: {
        where: { page_type: "notice" },
        orderBy: { position: "asc" },
        take: 5,
        select: { id: true, title: true, content: true, slug: true },
      },
    },
  });

  if (!site) return notFound();

  const tournamentId = site.tournamentId;

  // 항상 양쪽 쿼리 실행 — 각 페이지는 필요한 데이터만 렌더링
  const [teams, matches] = await Promise.all([
    prisma.tournamentTeam.findMany({
      where: { tournamentId, status: "approved" },
      include: {
        team: { select: { name: true, logoUrl: true, city: true } },
      },
      orderBy: [{ wins: "desc" }, { point_difference: "desc" }],
    }),
    prisma.tournamentMatch.findMany({
      where: { tournamentId },
      include: {
        homeTeam: { include: { team: { select: { name: true, logoUrl: true } } } },
        awayTeam: { include: { team: { select: { name: true, logoUrl: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const slug = site.siteTemplate?.slug ?? "classic-tournament";
  const templateType: "classic" | "dark" | "minimal" = MINIMAL_SLUGS.has(slug)
    ? "minimal"
    : DARK_SLUGS.has(slug)
    ? "dark"
    : "classic";

  return (
    <ClassicTemplate
      site={site}
      teams={teams}
      matches={matches}
      currentPage={currentPage}
      templateType={templateType}
    />
  );
}
