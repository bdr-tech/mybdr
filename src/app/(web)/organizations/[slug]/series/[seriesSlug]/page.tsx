import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

/* ============================================================
 * 시리즈 상세 (공개) — /organizations/[slug]/series/[seriesSlug]
 *
 * 회차 타임라인: 각 대회를 시간순으로 나열.
 * 상태(진행중/종료) + 우승팀 표시.
 * ============================================================ */

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string; seriesSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seriesSlug } = await params;
  const series = await prisma.tournament_series.findUnique({
    where: { slug: seriesSlug },
    select: { name: true, description: true },
  });
  if (!series) return { title: "시리즈 | MyBDR" };
  return {
    title: `${series.name} | MyBDR`,
    description: series.description || `${series.name} 시리즈`,
  };
}

// 대회 상태 한국어 매핑
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "준비중", color: "var(--color-text-muted)" },
  upcoming: { label: "예정", color: "var(--color-info)" },
  registration: { label: "접수중", color: "var(--color-info)" },
  active: { label: "접수중", color: "var(--color-info)" },
  open: { label: "접수중", color: "var(--color-info)" },
  in_progress: { label: "진행중", color: "var(--color-primary)" },
  live: { label: "진행중", color: "var(--color-primary)" },
  completed: { label: "종료", color: "var(--color-text-disabled)" },
  ended: { label: "종료", color: "var(--color-text-disabled)" },
  cancelled: { label: "취소", color: "var(--color-text-disabled)" },
};

export default async function SeriesDetailPage({ params }: Props) {
  const { slug, seriesSlug } = await params;

  // 시리즈 + 단체 + 대회 목록 조회
  const series = await prisma.tournament_series.findUnique({
    where: { slug: seriesSlug },
    include: {
      organization: {
        select: { name: true, slug: true, logo_url: true },
      },
      tournaments: {
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          name: true,
          edition_number: true,
          status: true,
          startDate: true,
          endDate: true,
          champion_team_id: true,
          venue_name: true,
          teams_count: true,
          maxTeams: true,
          // 우승팀 이름 가져오기
          teams: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!series || !series.is_public) {
    notFound();
  }

  // 단체 slug가 URL과 일치하는지 검증 (보안)
  if (series.organization && series.organization.slug !== slug) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 브레드크럼 */}
      <nav className="mb-4 text-xs text-[var(--color-text-muted)]">
        <Link
          href="/organizations"
          className="hover:text-[var(--color-text-primary)]"
        >
          단체
        </Link>
        <span className="mx-1">/</span>
        {series.organization && (
          <>
            <Link
              href={`/organizations/${series.organization.slug}`}
              className="hover:text-[var(--color-text-primary)]"
            >
              {series.organization.name}
            </Link>
            <span className="mx-1">/</span>
          </>
        )}
        <span className="text-[var(--color-text-primary)]">{series.name}</span>
      </nav>

      {/* 시리즈 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {series.name}
        </h1>
        {series.description && (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {series.description}
          </p>
        )}
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          총 {series.tournaments.length}회차
        </p>
      </div>

      {/* 회차 타임라인 */}
      {series.tournaments.length > 0 ? (
        <div className="relative">
          {/* 타임라인 세로선 */}
          <div className="absolute left-5 top-0 h-full w-0.5 bg-[var(--color-border)]" />

          <div className="space-y-4">
            {series.tournaments.map((t, idx) => {
              const st = STATUS_MAP[t.status || "draft"] || STATUS_MAP.draft;
              const isCompleted =
                t.status === "completed" || t.status === "ended";

              return (
                <div key={t.id} className="relative pl-12">
                  {/* 타임라인 도트 */}
                  <div
                    className="absolute left-3.5 top-4 h-3 w-3 rounded-full border-2"
                    style={{
                      borderColor: st.color,
                      backgroundColor: isCompleted
                        ? st.color
                        : "var(--color-card)",
                    }}
                  />

                  <Link
                    href={`/tournaments/${t.id}`}
                    className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-primary)]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        {/* 회차 번호 + 대회 이름 */}
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {t.edition_number
                            ? `#${t.edition_number} `
                            : `#${series.tournaments.length - idx} `}
                          {t.name}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                          {t.startDate && (
                            <span>
                              {new Date(t.startDate).toLocaleDateString(
                                "ko-KR"
                              )}
                            </span>
                          )}
                          {t.venue_name && (
                            <>
                              <span>·</span>
                              <span>{t.venue_name}</span>
                            </>
                          )}
                          {t.teams_count != null && (
                            <>
                              <span>·</span>
                              <span>
                                {t.teams_count}/{t.maxTeams || "?"}팀
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 상태 뱃지 */}
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          color: st.color,
                          backgroundColor: `color-mix(in srgb, ${st.color} 12%, transparent)`,
                        }}
                      >
                        {st.label}
                      </span>
                    </div>

                    {/* 우승팀 (종료된 대회만) */}
                    {isCompleted && t.champion_team_id && t.teams && (
                      <div className="mt-2 flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">
                          emoji_events
                        </span>
                        <span className="font-medium text-[var(--color-primary)]">
                          우승: {t.teams.name}
                        </span>
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
          아직 등록된 대회가 없습니다.
        </p>
      )}
    </div>
  );
}
