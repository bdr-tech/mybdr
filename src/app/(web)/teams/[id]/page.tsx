import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TeamJoinButton } from "./join-button";
import { OverviewTab } from "./_tabs/overview-tab";
import { RosterTab } from "./_tabs/roster-tab";
import { GamesTab } from "./_tabs/games-tab";
import { TournamentsTab } from "./_tabs/tournaments-tab";

export const revalidate = 60;

// SEO: 팀 상세 동적 메타데이터 — 팀명을 DB에서 조회하여 title에 반영
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id: BigInt(id) },
    select: { name: true, city: true },
  }).catch(() => null);
  if (!team) return { title: "팀 상세 | MyBDR" };
  const location = team.city ? ` (${team.city})` : "";
  return {
    title: `${team.name}${location} | MyBDR`,
    description: `${team.name} 팀의 로스터, 전적, 대회 이력을 확인하세요.`,
  };
}

// 팀 고유색에서 유효한 accent 색상을 추출하는 함수 (흰색/없음이면 기본 네이비)
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

// 탭 정의 — Material Symbols 아이콘 포함
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "overview", label: "개요", icon: "dashboard" },
  { key: "roster", label: "로스터", icon: "groups" },
  { key: "games", label: "경기기록", icon: "sports_basketball" },
  { key: "tournaments", label: "대회이력", icon: "emoji_events" },
];

// 디비전 배지 계산 — 승수 기반 (DB에 division 필드 없음)
function computeDivision(wins: number): { label: string; style: string } | null {
  if (wins >= 50) return { label: "PLATINUM", style: "border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]" };
  if (wins >= 30) return { label: "PRO", style: "border-[var(--color-primary)] text-[var(--color-primary)]" };
  if (wins >= 15) return { label: "GOLD", style: "border-yellow-500 text-yellow-500" };
  if (wins >= 5) return { label: "SILVER", style: "border-[var(--color-text-muted)] text-[var(--color-text-muted)]" };
  if (wins >= 1) return { label: "ROOKIE", style: "border-green-500 text-green-500" };
  return null;
}

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

  // 기존 prisma 쿼리 100% 유지
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

  // 기존 데이터 변환 로직 100% 유지
  const accent = resolveAccent(team.primaryColor, team.secondaryColor);
  const memberCount = team.teamMembers.length;
  const location = [team.city, team.district].filter(Boolean).join(" ");
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const draws = team.draws ?? 0;
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : null;
  const division = computeDivision(wins);

  return (
    <div className="space-y-0">

      {/* ===== 히어로 배너 ===== */}
      {/* 팀 고유색 그라디언트 배경 + 어두운 오버레이 */}
      <section className="relative w-full overflow-hidden" style={{ height: "280px" }}>
        {/* 팀 고유색 그라디언트 배경 (이미지 대신) */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}99 40%, var(--color-card) 100%)`,
          }}
        />
        {/* 어두운 오버레이 — 텍스트 가독성 확보 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/40 to-transparent" />

        {/* 히어로 콘텐츠 — 좌측 팀 정보 + 우측 CTA 버튼 */}
        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 lg:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            {/* 좌측: 팀 로고 + 정보 */}
            <div className="flex items-center gap-6">
              {/* 팀 이니셜 아이콘 (w-24 h-24) */}
              <div className="relative flex-shrink-0">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded border-4 border-[var(--color-background)] text-4xl font-black text-white shadow-xl"
                  style={{ backgroundColor: accent }}
                >
                  {team.name.charAt(0).toUpperCase()}
                </div>
                {/* 디비전 배지 — 아이콘 우하단 */}
                {division && (
                  <div
                    className="absolute -bottom-2 -right-2 rounded bg-[var(--color-primary)] px-1.5 py-0.5 text-xs font-bold text-white"
                  >
                    {division.label}
                  </div>
                )}
              </div>

              {/* 팀명 + 메타 정보 */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1
                    className="text-3xl font-bold text-white lg:text-4xl"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {team.name}
                  </h1>
                  {/* 디비전 텍스트 배지 (아웃라인 스타일) */}
                  {division && (
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold ${division.style}`}>
                      {division.label}
                    </span>
                  )}
                </div>

                {/* 메타 정보: 지역 / 멤버수 / 창단일 */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                  {location && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">groups</span>
                    {memberCount}명
                  </span>
                  {team.founded_year && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {team.founded_year}년 창단
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 우측: CTA 버튼 그룹 */}
            <div className="flex items-center gap-3">
              <TeamJoinButton teamId={id} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 탭 네비게이션 ===== */}
      {/* 활성 탭: text-primary + 빨간 하단 밑줄, 비활성: text-muted */}
      <nav className="sticky top-16 z-30 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm px-8 lg:px-12">
        <div className="flex gap-8">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/teams/${id}?tab=${t.key}`}
              className={`flex items-center gap-1.5 py-4 text-sm font-medium transition-colors border-b-2 ${
                currentTab === t.key
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] font-bold"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ===== 탭 컨텐츠 ===== */}
      <div className="px-8 py-8 lg:px-12">
        <Suspense fallback={<div className="h-32 rounded bg-[var(--color-card)]" />}>
          {currentTab === "overview" && (
            <OverviewTab
              teamId={team.id}
              accent={accent}
              team={{
                name: team.name,
                description: team.description,
                wins,
                losses,
                draws,
                winRate,
                memberCount,
                location,
                city: team.city,
              }}
            />
          )}
          {currentTab === "roster" && <RosterTab teamId={team.id} accent={accent} />}
          {currentTab === "games" && <GamesTab teamId={team.id} accent={accent} />}
          {currentTab === "tournaments" && <TournamentsTab teamId={team.id} />}
        </Suspense>
      </div>
    </div>
  );
}
