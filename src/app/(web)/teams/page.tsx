import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { TeamsFilter } from "./teams-filter";
import { TeamCard } from "./_components/team-card";

export const revalidate = 60;

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const { q, city } = await searchParams;

  const [teams, citiesRaw] = await Promise.all([
    prisma.team.findMany({
      where: {
        status: "active",
        is_public: true,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(city && city !== "all" ? { city: { contains: city, mode: "insensitive" } } : {}),
      },
      orderBy: [{ wins: "desc" }, { createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        city: true,
        district: true,
        wins: true,
        losses: true,
        accepting_members: true,
        tournaments_count: true,
        _count: { select: { teamMembers: true } },
      },
    }).catch(() => []),
    prisma.team.groupBy({
      by: ["city"],
      where: { city: { not: null }, status: "active", is_public: true },
      orderBy: { _count: { city: "desc" } },
      take: 30,
    }).catch(() => []),
  ]);

  const cities = citiesRaw.map((r) => r.city!).filter(Boolean);

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">팀</h1>
        <Link
          href="/teams/new"
          className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0052CC] transition-colors"
        >
          팀 만들기
        </Link>
      </div>

      {/* 필터 */}
      <Suspense fallback={<div className="mb-6 h-10" />}>
        <TeamsFilter cities={cities} />
      </Suspense>

      {/* 결과 카운트 */}
      {(q || (city && city !== "all")) && (
        <p className="mb-3 text-sm text-[#9CA3AF]">
          검색 결과 <span className="text-[#111827]">{teams.length}개</span>
        </p>
      )}

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {teams.map((team) => (
          <TeamCard key={team.id.toString()} team={team} />
        ))}

        {teams.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="mb-3 text-4xl">🏅</div>
            <p className="text-[#6B7280]">
              {q || city ? "조건에 맞는 팀이 없습니다." : "등록된 팀이 없습니다."}
            </p>
          </div>
        )}
      </div>

      {teams.length > 0 && (
        <p className="mt-3 text-right text-xs text-[#94A3B8]">총 {teams.length}개 팀</p>
      )}
    </div>
  );
}
