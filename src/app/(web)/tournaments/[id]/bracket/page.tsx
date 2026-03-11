import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { buildRoundGroups } from "@/lib/tournaments/bracket-builder";
import { BracketView } from "./_components/bracket-view";
import { BracketEmpty } from "./_components/bracket-empty";

export const revalidate = 30;

export default async function BracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 대회 존재 확인
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, format: true },
  });

  if (!tournament) return notFound();

  // 대진표 매치 데이터 조회
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
    include: {
      homeTeam: {
        include: {
          team: { select: { name: true, primaryColor: true } },
        },
      },
      awayTeam: {
        include: {
          team: { select: { name: true, primaryColor: true } },
        },
      },
    },
  });

  // 대진표가 없는 경우
  if (matches.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">대진표</h1>
        <BracketEmpty tournamentId={id} />
      </div>
    );
  }

  // bracket_position이 있는 매치만 대진표용으로 사용
  // (round_robin이나 bracket 없는 매치 제외)
  const bracketMatches = matches.filter(
    (m) => m.round_number != null && m.bracket_position != null,
  );

  if (bracketMatches.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">대진표</h1>
        <BracketEmpty tournamentId={id} />
      </div>
    );
  }

  // DB 매치 → 라운드 그룹 구조로 변환
  const rounds = buildRoundGroups(bracketMatches);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">대진표</h1>
      <BracketView rounds={rounds} tournamentId={id} />
    </div>
  );
}
