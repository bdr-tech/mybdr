import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Breadcrumb, type BreadcrumbItem } from "@/components/shared/breadcrumb";

export const revalidate = 30;

const STATUS_INFO: Record<string, { label: string; variant: "success" | "default" | "error" | "warning" | "info" }> = {
  draft:               { label: "준비중",   variant: "default" },
  registration_open:   { label: "모집중",   variant: "success" },
  registration_closed: { label: "접수마감", variant: "warning" },
  ongoing:             { label: "진행중",   variant: "info" },
  completed:           { label: "완료",    variant: "default" },
  cancelled:           { label: "취소",    variant: "error" },
};

function getSeriesData(slug: string) {
  return unstable_cache(
    async () => {
      const series = await prisma.tournament_series.findUnique({
        where: { slug },
        include: {
          // L3: 상위 단체 — 브레드크럼에 단체 링크 추가
          organization: { select: { name: true, slug: true } },
          tournaments: {
            orderBy: { edition_number: "desc" },
            select: {
              id: true,
              name: true,
              edition_number: true,
              startDate: true,
              status: true,
              venue_name: true,
              city: true,
              maxTeams: true,
              teams_count: true,
              is_public: true,
            },
          },
        },
      }).catch(() => null);
      return series;
    },
    [`series-hub-${slug}`],
    { revalidate: 30 }
  )();
}

export default async function SeriesHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = await getSeriesData(slug);

  if (!series) notFound();

  const publicEditions = series.tournaments.filter((t) => t.is_public !== false);
  const totalTeams = publicEditions.reduce((sum, t) => sum + (t.teams_count ?? 0), 0);
  const latestActive = publicEditions.find(
    (t) => t.status === "registration_open" || t.status === "ongoing"
  );

  // L3 브레드크럼: 홈 / [단체명 /] {시리즈명}
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "홈", href: "/" }];
  if (series.organization) {
    breadcrumbItems.push({
      label: series.organization.name,
      href: `/organizations/${series.organization.slug}`,
    });
  } else {
    // 단체 소속 없음: 시리즈 허브 목록으로 연결
    breadcrumbItems.push({ label: "시리즈", href: "/series" });
  }
  breadcrumbItems.push({ label: series.name });

  return (
    <div className="mx-auto max-w-2xl pb-16">
      {/* L3 브레드크럼 — PC에서만 표시 (breadcrumb.tsx 내부에서 hidden lg:block) */}
      <div className="mb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* 헤더 */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">{series.name}</h1>
        {series.description && (
          <p className="mt-2 text-[var(--color-text-muted)]">{series.description}</p>
        )}
      </div>

      {/* 통계 */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-[16px] bg-[var(--color-surface-bright)] p-4 text-center">
          <p className="text-xl font-bold sm:text-2xl text-[var(--color-accent)]">{series.tournaments_count ?? 0}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">총 회차</p>
        </div>
        <div className="rounded-[16px] bg-[var(--color-surface-bright)] p-4 text-center">
          <p className="text-xl font-bold sm:text-2xl text-[var(--color-accent)]">{totalTeams}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">누적 참가팀</p>
        </div>
        <div className="rounded-[16px] bg-[var(--color-surface-bright)] p-4 text-center">
          <p className="text-xl font-bold sm:text-2xl text-[var(--color-primary)]">
            {latestActive ? `${latestActive.edition_number}회` : "-"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">진행 중</p>
        </div>
      </div>

      {/* CTA — 모집 중인 회차 강조 */}
      {latestActive && (
        <Link href={`/tournaments/${latestActive.id}`}>
          <div className="mb-6 rounded-[16px] bg-[var(--color-accent)] px-6 py-4 text-[var(--color-on-accent)]">
            <p className="text-xs opacity-80">현재 신청 가능</p>
            <p className="mt-0.5 text-lg font-bold">{latestActive.name}</p>
            {latestActive.startDate && (
              <p className="mt-1 text-sm opacity-80">
                {new Date(latestActive.startDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                {latestActive.venue_name && ` · ${latestActive.venue_name}`}
              </p>
            )}
            <p className="mt-2 text-sm font-semibold">신청하러 가기 →</p>
          </div>
        </Link>
      )}

      {/* 회차 타임라인 */}
      <h2 className="mb-3 text-base font-semibold">역대 회차</h2>

      {publicEditions.length > 0 ? (
        <div className="space-y-3">
          {publicEditions.map((t) => {
            const info = STATUS_INFO[t.status ?? "draft"] ?? { label: t.status, variant: "default" as const };
            const location = [t.city, t.venue_name].filter(Boolean).join(" ");
            return (
              <Link key={t.id} href={`/tournaments/${t.id}`}>
                <Card className="flex items-center justify-between hover:bg-[var(--color-surface-bright)] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-bright)] text-sm font-bold text-[var(--color-accent)]">
                      {t.edition_number}
                    </span>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {t.startDate
                          ? new Date(t.startDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
                          : "날짜 미정"}
                        {location && ` · ${location}`}
                        {` · ${t.teams_count ?? 0}/${t.maxTeams ?? "?"}팀`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={info.variant}>{info.label}</Badge>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <p className="text-sm">아직 공개된 회차가 없습니다.</p>
        </Card>
      )}
    </div>
  );
}
