import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TeamsFilter } from "./teams-filter";

export const dynamic = "force-dynamic";

function resolveColor(primary: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return "#F4A261";
  }
  return primary;
}

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
          className="rounded-full bg-[#F4A261] px-4 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E8934E] transition-colors"
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
        <p className="mb-3 text-sm text-[#666666]">
          검색 결과 <span className="text-white">{teams.length}개</span>
        </p>
      )}

      {/* 게시판 리스트 */}
      <div className="overflow-hidden rounded-[16px] border border-[#2A2A2A] bg-[#1A1A1A]">
        {/* 헤더 행 */}
        <div className="grid grid-cols-[1fr_auto] items-center border-b border-[#2A2A2A] bg-[#161616] px-4 py-2.5 text-xs text-[#555555] sm:grid-cols-[auto_1fr_auto_auto_auto]">
          <span className="hidden sm:block w-5" />
          <span>팀명</span>
          <span className="hidden sm:block w-20 text-center">전적</span>
          <span className="hidden sm:block w-16 text-center">멤버</span>
          <span className="hidden sm:block w-16 text-center">상태</span>
        </div>

        {teams.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-2 text-3xl">🏅</div>
            <p className="text-sm text-[#A0A0A0]">
              {q || city ? "조건에 맞는 팀이 없습니다." : "등록된 팀이 없습니다."}
            </p>
          </div>
        ) : (
          teams.map((team, idx) => {
            const accent = resolveColor(team.primaryColor);
            const wins = team.wins ?? 0;
            const losses = team.losses ?? 0;
            const memberCount = team._count.teamMembers;
            const location = [team.city, team.district].filter(Boolean).join(" ");
            const hasRecord = wins > 0 || losses > 0;

            return (
              <Link key={team.id.toString()} href={`/teams/${team.id}`}>
                <div
                  className={`grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-[#222222] sm:grid-cols-[auto_1fr_auto_auto_auto] ${
                    idx !== 0 ? "border-t border-[#242424]" : ""
                  }`}
                >
                  {/* 컬러 점 */}
                  <div
                    className="hidden sm:flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: `${accent}55` }}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </div>

                  {/* 팀명 + 지역 */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {/* 모바일용 컬러 점 */}
                      <div
                        className="sm:hidden flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: `${accent}55` }}
                      >
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate font-medium text-white">{team.name}</span>
                    </div>
                    {location && (
                      <span className="text-xs text-[#666666]">{location}</span>
                    )}
                  </div>

                  {/* 전적 */}
                  <div className="hidden sm:flex w-20 items-center justify-center">
                    {hasRecord ? (
                      <span className="text-sm text-[#A0A0A0]">
                        <span className="font-medium text-white">{wins}</span>승{" "}
                        <span className="font-medium text-[#A0A0A0]">{losses}</span>패
                      </span>
                    ) : (
                      <span className="text-xs text-[#444444]">-</span>
                    )}
                  </div>

                  {/* 멤버 */}
                  <div className="hidden sm:flex w-16 items-center justify-center text-sm text-[#A0A0A0]">
                    👥 {memberCount}
                  </div>

                  {/* 상태 + 대회 */}
                  <div className="flex items-center gap-1.5">
                    {team.accepting_members && (
                      <Badge variant="success">모집중</Badge>
                    )}
                    {(team.tournaments_count ?? 0) > 0 && (
                      <span className="hidden sm:inline text-[10px] text-[#555555]">
                        대회 {team.tournaments_count}
                      </span>
                    )}
                    {/* 모바일: 멤버 수 */}
                    <span className="sm:hidden text-xs text-[#555555]">
                      {memberCount}명
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* 총 카운트 */}
      {teams.length > 0 && (
        <p className="mt-3 text-right text-xs text-[#444444]">총 {teams.length}개 팀</p>
      )}
    </div>
  );
}
