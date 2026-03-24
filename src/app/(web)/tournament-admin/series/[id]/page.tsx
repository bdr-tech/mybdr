import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { CopyLinkButton } from "./_components/copy-link-button";

export const dynamic = "force-dynamic";

const STATUS_INFO: Record<string, { label: string; variant: "success" | "default" | "error" | "warning" | "info" }> = {
  draft:               { label: "준비중",   variant: "default" },
  registration_open:   { label: "모집중",   variant: "success" },
  registration_closed: { label: "접수마감", variant: "warning" },
  ongoing:             { label: "진행중",   variant: "info" },
  completed:           { label: "완료",    variant: "default" },
  cancelled:           { label: "취소",    variant: "error" },
};

export default async function SeriesDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");

  const series = await prisma.tournament_series.findUnique({
    where: { id: BigInt(id) },
    include: {
      tournaments: {
        orderBy: { edition_number: "asc" },
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
        },
      },
    },
  }).catch(() => null);

  if (!series) notFound();
  if (series.organizer_id !== BigInt(session.sub)) redirect("/tournament-admin/series");

  const totalTeams = series.tournaments.reduce((sum, t) => sum + (t.teams_count ?? 0), 0);
  const nextEdition = (series.tournaments_count ?? 0) + 1;

  return (
    <div className="pb-28">
      {/* 헤더 */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <Link href="/tournament-admin/series" className="mb-2 inline-block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-muted)]">
            ← 시리즈 목록
          </Link>
          <h1 className="text-xl font-bold sm:text-2xl">{series.name}</h1>
          {series.description && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{series.description}</p>
          )}
        </div>
        <CopyLinkButton slug={series.slug} />
      </div>

      {/* 통계 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[16px] bg-[var(--color-elevated)] p-4 text-center">
          <p className="text-xl font-bold sm:text-2xl text-[var(--color-accent)]">{series.tournaments_count ?? 0}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">총 회차</p>
        </div>
        <div className="rounded-[16px] bg-[var(--color-elevated)] p-4 text-center">
          <p className="text-xl font-bold sm:text-2xl text-[var(--color-accent)]">{totalTeams}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">누적 참가팀</p>
        </div>
        <div className="hidden rounded-[16px] bg-[var(--color-elevated)] p-4 text-center sm:block">
          <p className="text-xl font-bold sm:text-2xl text-[var(--color-primary)]">{nextEdition}회</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">다음 회차</p>
        </div>
      </div>

      {/* 회차 목록 */}
      <h2 className="mb-3 text-base font-semibold">회차 목록</h2>

      {series.tournaments.length > 0 ? (
        <div className="space-y-3">
          {series.tournaments.map((t) => {
            const info = STATUS_INFO[t.status ?? "draft"] ?? { label: t.status, variant: "default" as const };
            const location = [t.city, t.venue_name].filter(Boolean).join(" ");
            return (
              <Link key={t.id} href={`/tournament-admin/tournaments/${t.id}`}>
                <Card className="flex items-center justify-between hover:bg-[var(--color-elevated)] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                      {t.edition_number}
                    </span>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
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
          <div className="mb-3 text-3xl">🏆</div>
          <p className="mb-4 text-sm">아직 회차가 없습니다.</p>
          <Link
            href={`/tournament-admin/series/${id}/add-edition`}
            className="inline-block rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            첫 번째 회차 추가하기
          </Link>
        </Card>
      )}

      {/* 모바일 하단 고정 버튼 */}
      {series.tournaments.length > 0 && (
        <div className="fixed bottom-20 right-4 lg:bottom-8">
          <Link
            href={`/tournament-admin/series/${id}/add-edition`}
            className="flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <span className="text-lg">+</span>
            {nextEdition}회 추가
          </Link>
        </div>
      )}
    </div>
  );
}
