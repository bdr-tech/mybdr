import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { OrgsListV2 } from "./_components/orgs-list-v2";
import type { OrgCardData } from "./_components/org-card-v2";

/* ============================================================
 * 단체 목록 (공개) — /organizations  [BDR v2 디자인 적용]
 *
 * 공개 단체를 카드 그리드로 표시. 그라디언트 헤더 + 통계 3분할.
 * SSR + ISR 캐시 적용 (60초). 데이터 패칭 로직은 v1과 동일 — UI만 교체.
 *
 * 향후 Phase 3 Orgs 추가 예정:
 *   - organizations.kind (리그/협회/동호회) → 실제 필터링
 *   - organizations.brand_color → 헤더 그라디언트
 *   - organizations.tag → 자동 생성 대신 명시값 사용
 *   - 단체 가입 신청 API
 *   - 단체별 팀 수 집계 (series→teams 조인)
 * ============================================================ */

export const metadata: Metadata = {
  title: "단체 목록 | MyBDR",
  description: "대회를 주최하는 농구 단체 목록을 확인하세요.",
};

export const revalidate = 60; // 60초 ISR

export default async function OrganizationsPage() {
  // 공개 + 활성 단체만 조회 (시리즈 수 내림차순) — 기존 쿼리 그대로 유지
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

  // BigInt → string 직렬화 + 클라 컴포넌트용 props 매핑
  const cardData: OrgCardData[] = orgs.map((org) => ({
    id: org.id.toString(),
    slug: org.slug,
    name: org.name,
    logoUrl: org.logo_url,
    region: org.region,
    description: org.description,
    membersCount: org._count.members,
    seriesCount: org.series_count,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 페이지 헤더: eyebrow + h1 + 부제 + 등록 버튼 */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            단체 · ORGANIZATIONS
          </div>
          <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight text-[var(--color-text-primary)]">
            리그 · 협회 · 동호회
          </h1>
          <div className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            여러 팀을 아우르는 {orgs.length}개의 농구 단체
          </div>
        </div>
        {/* 단체 등록 버튼 (라벨: PM 지시 "단체 등록"). 기존 /apply 라우트 유지 */}
        <Link
          href="/organizations/apply"
          className="inline-flex items-center gap-1.5 rounded bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          단체 등록
        </Link>
      </div>

      {/* 클라 컨테이너: 필터 chip + 그리드 */}
      <OrgsListV2 orgs={cardData} />
    </div>
  );
}
