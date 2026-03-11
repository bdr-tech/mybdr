import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SeriesEditionRedirectPage({
  params,
}: {
  params: Promise<{ slug: string; editionNumber: string }>;
}) {
  const { slug, editionNumber } = await params;
  const num = parseInt(editionNumber, 10);

  if (isNaN(num)) notFound();

  const series = await prisma.tournament_series.findUnique({
    where: { slug },
    select: { id: true },
  }).catch(() => null);

  if (!series) notFound();

  const tournament = await prisma.tournament.findFirst({
    where: { series_id: series.id, edition_number: num },
    select: { id: true },
  }).catch(() => null);

  if (!tournament) notFound();

  redirect(`/tournaments/${tournament.id}`);
}
