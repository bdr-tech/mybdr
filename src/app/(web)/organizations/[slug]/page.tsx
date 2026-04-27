import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
// L3: 3계층 IA 브레드크럼 (홈 → 단체 → 단체명)
import { Breadcrumb } from "@/components/shared/breadcrumb";
// v2 컴포넌트 묶음
import { OrgHeroV2 } from "./_components_v2/org-hero-v2";
import {
  OrgTabsV2,
  type OrgTabKey,
} from "./_components_v2/org-tabs-v2";
import { OverviewTabV2 } from "./_components_v2/overview-tab-v2";
import { TeamsTabV2 } from "./_components_v2/teams-tab-v2";
import { EventsTabV2 } from "./_components_v2/events-tab-v2";
import { MembersTabV2 } from "./_components_v2/members-tab-v2";

/* ============================================================
 * 단체 상세 v2 — /organizations/[slug]?tab=overview|teams|events|members
 *
 * 변경 의도:
 *  - 디자인을 BDR v2 시안(`Dev/design/BDR v2/screens/OrgDetail.jsx`)에 맞춰
 *    Hero + 4탭 + 탭별 컨텐츠로 재구성.
 *  - 데이터 패칭/Prisma 쿼리 변경 0 (UI만 교체) — Phase 3 Org 원칙 준수.
 *  - 활성 탭은 ?tab= 쿼리 파라미터로 동기화 (공유 링크/새로고침 안전).
 * ============================================================ */

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
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

// ?tab= 값 검증. 알 수 없는 값이면 기본 "overview".
function normalizeTab(raw: string | undefined): OrgTabKey {
  if (raw === "teams" || raw === "events" || raw === "members") return raw;
  return "overview";
}

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = normalizeTab(rawTab);

  // 기존 쿼리 그대로 유지 (이전 버전과 동일한 include 트리)
  const org = await prisma.organizations.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, nickname: true, profile_image_url: true } },
      members: {
        where: { is_active: true },
        select: {
          id: true,
          role: true,
          // since YYYY 라벨용으로 created_at 추가 (tab=members에서 사용)
          created_at: true,
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 브레드크럼: 홈 → 단체 → 단체명 (PC 전용 컴포넌트 내부 hidden lg:block) */}
      <div className="mb-3">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "단체", href: "/organizations" },
            { label: org.name },
          ]}
        />
      </div>

      {/* Hero — 단체 brand color 그라디언트 + 가입 신청 alert */}
      <OrgHeroV2
        id={org.id.toString()}
        name={org.name}
        logoUrl={org.logo_url}
        region={org.region}
        description={org.description}
        membersCount={org.members.length}
      />

      {/* 4탭 (?tab= 동기화) */}
      <OrgTabsV2 active={tab} />

      {/* 탭별 컨텐츠 — 데이터 패칭은 위에서 한 번만 (탭 전환 시 SSR 재요청) */}
      {tab === "overview" && (
        <OverviewTabV2
          description={org.description}
          contactEmail={org.contact_email}
          contactPhone={org.contact_phone}
          websiteUrl={org.website_url}
        />
      )}

      {tab === "teams" && <TeamsTabV2 />}

      {tab === "events" && (
        <EventsTabV2
          orgSlug={slug}
          // BigInt id → 클라 컴포넌트 props로 넘길 일은 없으나 prop 타입 맞춤
          series={org.series.map((s) => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            tournaments: s.tournaments.map((t) => ({
              id: Number(t.id),
              name: t.name,
              status: t.status,
              startDate: t.startDate,
            })),
          }))}
        />
      )}

      {tab === "members" && (
        <MembersTabV2
          members={org.members.map((m) => ({
            id: m.id,
            role: m.role,
            created_at: m.created_at,
            user: {
              id: Number(m.user.id),
              nickname: m.user.nickname,
              profile_image_url: m.user.profile_image_url,
            },
          }))}
        />
      )}
    </div>
  );
}
