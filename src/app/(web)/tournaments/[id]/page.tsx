import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// 새 디자인 컴포넌트 (히어로 + 사이드바 + About 섹션)
import { TournamentHero } from "./_components/tournament-hero";
import { TournamentSidebar } from "./_components/tournament-sidebar";
import { TournamentAbout } from "./_components/tournament-about";

export const revalidate = 30;

// -- Skeleton for matches + standings (기존 유지) --
function MatchesStandingsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Skeleton className="mb-3 h-5 w-20" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-radius-card" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-12" />
        <Skeleton className="h-48 rounded-radius-card" />
      </div>
    </div>
  );
}

// -- Async component: matches + standings (기존 prisma 쿼리 100% 유지) --
async function MatchesAndStandings({ tournamentId }: { tournamentId: string }) {
  // 병렬 fetch: 경기 + 팀 순위를 동시에
  const [matches, teams] = await Promise.all([
    prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: { scheduledAt: "asc" },
      take: 10,
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { team: { select: { name: true } } } },
        awayTeam: { select: { team: { select: { name: true } } } },
      },
    }),
    prisma.tournamentTeam.findMany({
      where: { tournamentId },
      orderBy: [{ wins: "desc" }],
      select: {
        id: true,
        wins: true,
        losses: true,
        team: { select: { name: true } },
      },
    }),
  ]);

  // 경기나 팀이 없으면 렌더링하지 않음
  if (matches.length === 0 && teams.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 최근 경기 */}
      {matches.length > 0 && (
        <div>
          <h2
            className="mb-3 flex items-center gap-2 font-semibold uppercase tracking-wide"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-primary)" }}>sports_score</span>
            최근 경기
          </h2>
          <div className="space-y-2">
            {matches.map((m) => (
              <div
                key={m.id.toString()}
                className="flex items-center justify-between rounded-radius-card border p-3"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <span className="text-sm font-medium">{m.homeTeam?.team.name ?? "TBD"}</span>
                <span
                  className="rounded-full px-3 py-1 text-sm font-bold"
                  style={{ backgroundColor: "var(--color-elevated)" }}
                >
                  {m.homeScore}:{m.awayScore}
                </span>
                <span className="text-sm font-medium">{m.awayTeam?.team.name ?? "TBD"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 순위 테이블 */}
      {teams.length > 0 && (
        <div>
          <h2
            className="mb-3 flex items-center gap-2 font-semibold uppercase tracking-wide"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-primary)" }}>leaderboard</span>
            순위
          </h2>
          <div
            className="overflow-hidden rounded-radius-card border"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  <th className="px-4 py-2 text-left" style={{ color: "var(--color-text-secondary)" }}>#</th>
                  <th className="px-4 py-2 text-left" style={{ color: "var(--color-text-secondary)" }}>팀</th>
                  <th className="px-4 py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>승</th>
                  <th className="px-4 py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>패</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={t.id.toString()} className="border-b last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
                    <td className="px-4 py-2 font-bold" style={{ color: "var(--color-primary)" }}>{i + 1}</td>
                    <td className="px-4 py-2">{t.team.name}</td>
                    <td className="px-4 py-2 text-center">{t.wins ?? 0}</td>
                    <td className="px-4 py-2 text-center">{t.losses ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// -- 메인 페이지 --
export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // UUID 형식이 아닌 경우 (예: /tournaments/new) 404 처리
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return notFound();
  }

  // 기존 prisma 쿼리 100% 유지: 대회 정보 조회
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      description: true,
      startDate: true,
      endDate: true,
      city: true,
      venue_name: true,
      entry_fee: true,
      registration_start_at: true,
      registration_end_at: true,
      categories: true,
      div_caps: true,
      div_fees: true,
      allow_waiting_list: true,
      bank_name: true,
      bank_account: true,
      bank_holder: true,
      maxTeams: true,
      _count: { select: { tournamentTeams: true } },
    },
  });
  if (!tournament) return notFound();

  // 접수 상태 판단 (기존 로직 유지)
  const now = new Date();
  const regStatuses = ["registration", "registration_open", "active", "published"];
  const isRegStatus = regStatuses.includes(tournament.status ?? "");
  const regOpen = tournament.registration_start_at;
  const regClose = tournament.registration_end_at;
  const isRegistrationOpen = isRegStatus && (!regOpen || regOpen <= now) && (!regClose || regClose >= now);
  const isRegistrationSoon = isRegStatus && regOpen && regOpen > now;

  // 디비전별 등록 현황 (기존 로직 유지)
  const categories = (tournament.categories ?? {}) as Record<string, string[]>;
  const divCaps = (tournament.div_caps ?? {}) as Record<string, number>;
  const divFees = (tournament.div_fees ?? {}) as Record<string, number>;
  const hasCategories = Object.keys(categories).length > 0;

  let divisionCounts: { division: string | null; _count: { id: number } }[] = [];
  if (hasCategories) {
    const grouped = await prisma.tournamentTeam.groupBy({
      by: ["division"] as const,
      where: { tournamentId: id, status: { in: ["pending", "approved"] } },
      _count: { id: true },
    });
    divisionCounts = grouped;
  }

  // 사이드바에 전달할 디비전 정보 가공
  const divisions = hasCategories
    ? Object.entries(categories).flatMap(([cat, divs]) =>
        divs.map((div) => ({
          category: cat,
          division: div,
          count: divisionCounts.find((d) => d.division === div)?._count.id ?? 0,
          cap: divCaps[div] ?? null,
          fee: divFees[div] ?? (tournament.entry_fee ? Number(tournament.entry_fee) : null),
        }))
      )
    : [];

  // 탭 목록 (기존 유지, 스타일만 밑줄 형식으로 변경)
  const tabs = [
    { href: `/tournaments/${id}`, label: "개요" },
    { href: `/tournaments/${id}/schedule`, label: "일정" },
    { href: `/tournaments/${id}/standings`, label: "순위" },
    { href: `/tournaments/${id}/bracket`, label: "대진표" },
    { href: `/tournaments/${id}/teams`, label: "참가팀" },
  ];

  return (
    <div>
      {/* 히어로 섹션: 그라디언트 배경 + 배지 + 대회명 + 메타 */}
      <TournamentHero
        name={tournament.name}
        format={tournament.format}
        status={tournament.status}
        startDate={tournament.startDate}
        endDate={tournament.endDate}
        city={tournament.city}
        venueName={tournament.venue_name}
        teamCount={tournament._count.tournamentTeams}
        maxTeams={tournament.maxTeams}
      />

      {/* 2열 레이아웃: 좌측 본문(col-span-8) + 우측 사이드카드(col-span-4) */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-10 lg:px-8">
        {/* 좌측 메인 콘텐츠 */}
        <div className="lg:col-span-8">
          {/* 밑줄 탭 네비게이션 (시안: 밑줄 활성 스타일) */}
          <div
            className="mb-8 flex gap-8 overflow-x-auto border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            {tabs.map((t) => {
              const isActiveTab = t.href === `/tournaments/${id}`;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  prefetch={true}
                  className="whitespace-nowrap pb-4 text-base font-medium transition-colors"
                  style={
                    isActiveTab
                      ? {
                          color: "var(--color-primary)",
                          fontWeight: 700,
                          borderBottom: "2px solid var(--color-primary)",
                          marginBottom: "-1px",
                        }
                      : { color: "var(--color-text-secondary)" }
                  }
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          {/* 대회 정보 (구조화된 설명) -- parseDescription 로직 100% 유지 */}
          {tournament.description && (
            <TournamentAbout
              description={tournament.description}
              categories={categories}
              format={tournament.format}
            />
          )}

          {/* 최근 경기 + 순위: Suspense로 스트리밍 (기존 유지) */}
          <div className="mt-8">
            <Suspense fallback={<MatchesStandingsSkeleton />}>
              <MatchesAndStandings tournamentId={id} />
            </Suspense>
          </div>
        </div>

        {/* 우측 사이드바: 참가비 + CTA + 캘린더 */}
        <div className="mt-8 lg:col-span-4 lg:mt-0">
          <TournamentSidebar
            tournamentId={id}
            entryFee={tournament.entry_fee ? Number(tournament.entry_fee) : null}
            isRegistrationOpen={isRegistrationOpen}
            isRegistrationSoon={isRegistrationSoon ?? false}
            regClose={regClose}
            name={tournament.name}
            startDate={tournament.startDate}
            endDate={tournament.endDate}
            venue={[tournament.city, tournament.venue_name].filter(Boolean).join(" ")}
            teamCount={tournament._count.tournamentTeams}
            maxTeams={tournament.maxTeams}
            divisions={divisions}
            allowWaitingList={tournament.allow_waiting_list}
            bankName={tournament.bank_name}
            bankAccount={tournament.bank_account}
            bankHolder={tournament.bank_holder}
          />
        </div>
      </div>
    </div>
  );
}
