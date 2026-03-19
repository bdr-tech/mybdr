import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TeamJoinButton } from "./join-button";
import { OverviewTab } from "./_tabs/overview-tab";
import { RosterTab } from "./_tabs/roster-tab";
import { GamesTab } from "./_tabs/games-tab";
import { TournamentsTab } from "./_tabs/tournaments-tab";

export const revalidate = 60;

function resolveAccent(primary: string | null, secondary: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    if (!secondary || secondary.toLowerCase() === "#ffffff" || secondary.toLowerCase() === "#fff") {
      return "#1B3C87";
    }
    return secondary;
  }
  return primary;
}

type Tab = "overview" | "roster" | "games" | "tournaments";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "개요" },
  { key: "roster", label: "로스터" },
  { key: "games", label: "경기기록" },
  { key: "tournaments", label: "대회이력" },
];

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const currentTab: Tab = (TABS.find((t) => t.key === tab)?.key) ?? "overview";

  const team = await prisma.team.findUnique({
    where: { id: BigInt(id) },
    include: {
      teamMembers: {
        where: { status: "active" },
        include: { user: { select: { id: true, nickname: true, name: true } } },
        orderBy: [{ role: "asc" }],
      },
    },
  }).catch(() => null);
  if (!team) return notFound();

  const accent = resolveAccent(team.primaryColor, team.secondaryColor);
  const secondary = team.secondaryColor ?? "#FFFFFF";
  const memberCount = team.teamMembers.length;
  const maxMembers = team.max_members ?? 15;
  const location = [team.city, team.district].filter(Boolean).join(" ");
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const draws = team.draws ?? 0;
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : null;

  const captain = team.teamMembers.find((m) => m.role === "captain");
  const captainName = captain?.user?.nickname ?? captain?.user?.name;

  return (
    <div className="space-y-4">
      {/* 히어로 배너 */}
      <div
        className="relative overflow-hidden rounded-[20px] p-6"
        style={{
          background: `linear-gradient(135deg, ${secondary}ee 0%, ${secondary}99 50%, #FFFFFF 100%)`,
          border: `1px solid ${accent}33`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-10"
          style={{ backgroundColor: accent }}
        />
        <div
          className="pointer-events-none absolute -bottom-6 right-16 h-20 w-20 rounded-full opacity-10"
          style={{ backgroundColor: accent }}
        />

        <div className="relative flex items-start gap-4">
          <div
            className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-3xl font-black text-[#111827]"
            style={{ backgroundColor: `${accent}55`, border: `2px solid ${accent}66` }}
          >
            {team.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold uppercase tracking-wide text-[#111827] sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{team.name}</h1>
              {team.accepting_members && <Badge variant="success">모집중</Badge>}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[#6B7280]">
              {location && <span className="inline-flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>{location}</span>}
              {team.founded_year && <span className="inline-flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>{team.founded_year}년 창단</span>}
              {captainName && <span className="inline-flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7Z"/><path d="M12 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>주장 {captainName}</span>}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              {[
                { value: wins, label: "승" },
                { value: losses, label: "패" },
                ...(draws > 0 ? [{ value: draws, label: "무" }] : []),
                ...(winRate !== null ? [{ value: `${winRate}%`, label: "승률" }] : []),
                { value: memberCount, label: "멤버" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex min-w-[52px] flex-col items-center rounded-[10px] bg-[#FFFFFF0A] px-3 py-1.5"
                >
                  <span className="text-lg font-bold text-[#111827]">{value}</span>
                  <span className="text-xs text-[#6B7280]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {team.description && (
          <p className="relative mt-4 border-t border-[#FFFFFF0F] pt-4 text-sm leading-relaxed text-[#6B7280]">
            {team.description}
          </p>
        )}

        <div className="relative mt-4 flex justify-end">
          <TeamJoinButton teamId={id} />
        </div>
      </div>

      {/* 멤버 현황 바 */}
      <div className="rounded-[16px] bg-white px-5 py-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>멤버 현황</span>
          <span className="text-[#6B7280]">{memberCount} / {maxMembers}명</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-[#E8ECF0]">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all"
            style={{ width: `${Math.min((memberCount / maxMembers) * 100, 100)}%`, backgroundColor: accent }}
          />
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 rounded-[16px] bg-white p-1.5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/teams/${id}?tab=${t.key}`}
            className={`flex-1 rounded-[12px] py-2 text-center text-sm font-medium transition-colors ${
              currentTab === t.key
                ? "bg-[#1B3C87] text-white"
                : "text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#111827]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <Suspense fallback={<div className="h-32 rounded-[16px] bg-white" />}>
        {currentTab === "overview" && <OverviewTab teamId={team.id} accent={accent} />}
        {currentTab === "roster" && <RosterTab teamId={team.id} accent={accent} />}
        {currentTab === "games" && <GamesTab teamId={team.id} accent={accent} />}
        {currentTab === "tournaments" && <TournamentsTab teamId={team.id} />}
      </Suspense>
    </div>
  );
}
