import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

/* ============================================================
 * 단체 상세 (공개) — /organizations/[slug]
 *
 * 로고 + 배너 + 소개 + 시리즈 카드 목록 + 통계.
 * SSR + ISR 캐시 (60초).
 * ============================================================ */

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const org = await prisma.organizations.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!org) return { title: "단체 | MyBDR" };
  return {
    title: `${org.name} | MyBDR`,
    description: org.description || `${org.name} 단체 페이지`,
  };
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { slug } = await params;

  const org = await prisma.organizations.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, nickname: true, profile_image_url: true } },
      members: {
        where: { is_active: true },
        select: {
          id: true,
          role: true,
          user: {
            select: { id: true, nickname: true, profile_image_url: true },
          },
        },
        orderBy: { created_at: "asc" },
        take: 20,
      },
      series: {
        where: { status: "active", is_public: true },
        orderBy: { created_at: "desc" },
        include: {
          tournaments: {
            orderBy: { startDate: "desc" },
            take: 3,
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
            },
          },
        },
      },
    },
  });

  if (!org || !org.is_public) {
    notFound();
  }

  // 전체 대회 수 계산 (시리즈별 tournaments_count 합산)
  const totalTournaments = org.series.reduce(
    (sum, s) => sum + (s.tournaments_count || 0),
    0
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 배너 */}
      {org.banner_url && (
        <div className="mb-6 h-40 w-full overflow-hidden rounded-lg">
          <img
            src={org.banner_url}
            alt={`${org.name} 배너`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* 헤더: 로고 + 이름 + 정보 */}
      <div className="mb-8 flex items-start gap-4">
        {org.logo_url ? (
          <img
            src={org.logo_url}
            alt={org.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-navy)] text-xl font-bold text-white">
            {org.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {org.name}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {org.region || "전국"} · 주최:{" "}
            {org.owner.nickname || "알 수 없음"}
          </p>
          {org.description && (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {org.description}
            </p>
          )}
          {/* 연락처 / 웹사이트 */}
          <div className="mt-2 flex gap-4 text-xs text-[var(--color-text-muted)]">
            {org.contact_email && (
              <span>
                <span className="material-symbols-outlined mr-0.5 text-xs align-middle">
                  mail
                </span>
                {org.contact_email}
              </span>
            )}
            {org.website_url && (
              <a
                href={org.website_url}
                target="_blank"
                rel="noopener"
                className="text-[var(--color-info)] hover:underline"
              >
                <span className="material-symbols-outlined mr-0.5 text-xs align-middle">
                  language
                </span>
                웹사이트
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 통계 카드 3개 */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {org.series.length}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">시리즈</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-info)]">
            {totalTournaments}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">대회</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {org.members.length}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">멤버</p>
        </div>
      </div>

      {/* 시리즈 카드 목록 */}
      <h2 className="mb-4 text-lg font-bold text-[var(--color-text-primary)]">
        시리즈
      </h2>
      {org.series.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {org.series.map((s) => (
            <Link
              key={s.id.toString()}
              href={`/organizations/${slug}/series/${s.slug}`}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-primary)]"
            >
              <div className="flex items-center gap-3">
                {s.logo_url ? (
                  <img
                    src={s.logo_url}
                    alt={s.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-[var(--color-border)] text-sm font-bold text-[var(--color-text-muted)]">
                    {s.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {s.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    대회 {s.tournaments_count || 0}개
                  </p>
                </div>
              </div>
              {/* 최근 대회 미리보기 */}
              {s.tournaments.length > 0 && (
                <div className="mt-3 border-t border-[var(--color-border)] pt-2">
                  {s.tournaments.map((t) => (
                    <p
                      key={t.id}
                      className="truncate text-xs text-[var(--color-text-muted)]"
                    >
                      {t.name} ·{" "}
                      {t.startDate
                        ? new Date(t.startDate).toLocaleDateString("ko-KR")
                        : "날짜 미정"}
                    </p>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
          아직 등록된 시리즈가 없습니다.
        </p>
      )}

      {/* 멤버 섹션 */}
      <h2 className="mb-4 mt-8 text-lg font-bold text-[var(--color-text-primary)]">
        멤버
      </h2>
      <div className="flex flex-wrap gap-3">
        {org.members.map((m) => (
          <Link
            key={m.id.toString()}
            href={`/profile/${m.user.id}`}
            className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm transition-colors hover:border-[var(--color-primary)]"
          >
            {m.user.profile_image_url ? (
              <img
                src={m.user.profile_image_url}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-border)] text-[10px] text-[var(--color-text-muted)]">
                {(m.user.nickname || "?").charAt(0)}
              </div>
            )}
            <span className="text-[var(--color-text-primary)]">
              {m.user.nickname || "이름 없음"}
            </span>
            {m.role === "owner" && (
              <span className="text-[10px] text-[var(--color-primary)]">
                주최자
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
