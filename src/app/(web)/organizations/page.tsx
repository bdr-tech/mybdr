import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import type { Metadata } from "next";

/* ============================================================
 * 단체 목록 (공개) — /organizations
 *
 * 공개 단체를 카드 그리드로 표시. 로고 + 이름 + 지역 + 시리즈 수.
 * SSR + ISR 캐시 적용 (60초).
 * ============================================================ */

export const metadata: Metadata = {
  title: "단체 목록 | MyBDR",
  description: "대회를 주최하는 농구 단체 목록을 확인하세요.",
};

export const revalidate = 60; // 60초 ISR

export default async function OrganizationsPage() {
  // 공개 + 활성 단체만 조회 (시리즈 수 내림차순)
  const orgs = await prisma.organizations.findMany({
    where: { is_public: true, status: "active" },
    orderBy: { series_count: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logo_url: true,
      region: true,
      series_count: true,
      description: true,
      _count: { select: { members: { where: { is_active: true } } } },
    },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">
        <span className="material-symbols-outlined mr-2 align-middle text-[var(--color-primary)]">
          corporate_fare
        </span>
        대회 단체
      </h1>

      {orgs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Link
              key={org.id.toString()}
              href={`/organizations/${org.slug}`}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-primary)]"
            >
              <div className="flex items-center gap-3">
                {/* 로고: 없으면 이름 이니셜로 대체 */}
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={org.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-navy)] text-base font-bold text-white">
                    {org.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--color-text-primary)]">
                    {org.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {org.region || "전국"} · 멤버 {org._count.members}명
                  </p>
                </div>
              </div>
              {/* 하단: 시리즈 수 + 소개 한 줄 */}
              <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  시리즈 {org.series_count}개
                </p>
                {org.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                    {org.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--color-text-disabled)]">
            corporate_fare
          </span>
          <p className="mt-2 text-[var(--color-text-muted)]">
            아직 등록된 단체가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
