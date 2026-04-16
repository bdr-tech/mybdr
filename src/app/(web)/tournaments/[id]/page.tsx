import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// 디자인 시안 컴포넌트: 히어로(배너) + About(대회 소개) + 탭
import { TournamentHero } from "./_components/tournament-hero";
import { TournamentAbout } from "./_components/tournament-about";
import { Breadcrumb } from "@/components/shared/breadcrumb";

// 탭 전환 컴포넌트 (클라이언트) — lazy loading 방식으로 변경
import { TournamentTabs } from "./_components/tournament-tabs";

// 비공개 대회 가드 — 관계자(organizer/admin member/super_admin)만 접근
import { getWebSession } from "@/lib/auth/web-session";
import { isTournamentInsider } from "@/lib/auth/tournament-auth";

export const revalidate = 30;

// SEO: 대회 상세 동적 메타데이터
// 비공개 대회는 제목/설명/OG 이미지를 노출하지 않아 SNS 미리보기로 정보 유출 방지
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true, description: true, banner_url: true, is_public: true },
  }).catch(() => null);
  if (!tournament) return { title: "대회 상세 | MyBDR" };

  // 비공개 대회는 메타데이터도 최소화 (이름/설명/이미지 노출 금지)
  if (tournament.is_public === false) {
    return { title: "대회 상세 | MyBDR", robots: { index: false, follow: false } };
  }

  const title = `${tournament.name} | MyBDR`;
  const description = tournament.description?.slice(0, 100) || `${tournament.name} 대회 일정, 참가 신청`;

  return {
    title,
    description,
    /* Open Graph: 카카오톡/페이스북 등 SNS 공유 시 미리보기 카드 */
    openGraph: {
      title: tournament.name,
      description,
      type: "website",
      url: `https://mybdr.kr/tournaments/${id}`,
      images: tournament.banner_url ? [{ url: tournament.banner_url }] : [],
    },
    /* Twitter Card: 트위터/X 공유 시 큰 이미지 카드 */
    twitter: {
      card: tournament.banner_url ? "summary_large_image" : "summary",
      title: tournament.name,
      description,
    },
  };
}

// -- 메인 페이지 --
export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // UUID 형식 검증
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return notFound();
  }

  // ========================================
  // 1) 대회 기본 정보 조회 (is_public 포함 — 비공개 가드용)
  // ========================================
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
      // 비공개 대회 접근 가드에 사용
      is_public: true,
      // 디자인 템플릿 관련 필드
      design_template: true,
      logo_url: true,
      banner_url: true,
      primary_color: true,
      secondary_color: true,
      // settings JSON — contact_phone 등 부가 설정 포함
      settings: true,
      _count: { select: { tournamentTeams: true } },
    },
  });
  if (!tournament) return notFound();

  // 비공개 대회: 관계자(organizer/admin member/super_admin)만 접근, 아니면 존재 숨김(404)
  if (tournament.is_public === false) {
    const session = await getWebSession();
    if (!session) return notFound();
    const userId = BigInt(session.sub);
    const insider = await isTournamentInsider(userId, id, session);
    if (!insider) return notFound();
  }

  // ========================================
  // 2) 탭별 lazy loading: 서버에서는 개요 탭 데이터만 조회
  //    나머지 탭(일정/순위/대진표/참가팀)은 클라이언트에서 API 호출
  // ========================================

  // ========================================
  // 3) 접수 상태 + 디비전 가공 (기존 로직 100% 유지)
  // ========================================
  const now = new Date();
  const regStatuses = ["registration", "registration_open", "active", "published"];
  const isRegStatus = regStatuses.includes(tournament.status ?? "");
  const regOpen = tournament.registration_start_at;
  const regClose = tournament.registration_end_at;
  const isRegistrationOpen = isRegStatus && (!regOpen || regOpen <= now) && (!regClose || regClose >= now);
  const isRegistrationSoon = isRegStatus && regOpen && regOpen > now;

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

  const divisions = hasCategories
    ? Object.entries(categories).flatMap(([cat, divs]) => {
        // divs가 배열이면 각 디비전을 순회, boolean(true)이면 카테고리만 표시
        if (Array.isArray(divs)) {
          return divs.map((div) => ({
            category: cat,
            division: div,
            count: divisionCounts.find((d) => d.division === div)?._count.id ?? 0,
            cap: divCaps[div] ?? null,
            fee: divFees[div] ?? (tournament.entry_fee ? Number(tournament.entry_fee) : null),
          }));
        }
        // boolean(true) 또는 기타 — 카테고리 자체를 1개 항목으로
        return [{
          category: cat,
          division: cat,
          count: divisionCounts.reduce((sum, d) => sum + d._count.id, 0),
          cap: 0 as number,
          fee: tournament.entry_fee ? Number(tournament.entry_fee) : 0,
        }];
      })
    : [];

  // ========================================
  // 4) 개요 탭 콘텐츠 조립 (서버 렌더링)
  //    나머지 탭은 TournamentTabs에서 클라이언트 lazy loading
  // ========================================

  const overviewContent = (
    <>
      {/* 대회 소개 카드 (TournamentAbout 컴포넌트: 설명 파서 + 카테고리 카드) */}
      {tournament.description && (
        <TournamentAbout
          description={tournament.description}
          categories={categories}
          format={tournament.format}
        />
      )}

      {/* 대회 장소 카드: 아이콘 + 장소명 컴팩트 표시 (지도 placeholder 제거) */}
      {(tournament.city || tournament.venue_name) && (
        <div
          className="mt-6 rounded-md border p-4"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div className="flex items-center gap-3">
            {/* 장소 아이콘 */}
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-info)" }}>location_on</span>
            </div>
            {/* 장소 정보 */}
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>대회 장소</p>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                {[tournament.venue_name, tournament.city].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 입금 정보 카드 */}
      {tournament.bank_name && tournament.bank_account && (
        <div
          className="mt-6 rounded-md border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-elevated)" }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-primary)" }}>account_balance</span>
            입금 정보
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>은행</p>
              <p className="text-sm font-medium">{tournament.bank_name}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>계좌번호</p>
              <p className="text-sm font-medium">{tournament.bank_account}</p>
            </div>
            {tournament.bank_holder && (
              <div>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>예금주</p>
                <p className="text-sm font-medium">{tournament.bank_holder}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 디비전별 현황 카드 */}
      {divisions.length > 0 && (
        <div
          className="mt-6 rounded-md border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <span className="h-6 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
            디비전별 현황
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {divisions.map((div) => {
              const remaining = div.cap ? div.cap - div.count : null;
              const isFull = remaining !== null && remaining <= 0;
              const progressPct = div.cap ? Math.min((div.count / div.cap) * 100, 100) : null;
              return (
                <div key={`${div.category}-${div.division}`} className="rounded-lg border p-3" style={{ borderColor: "var(--color-border)" }}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{div.category}</span>
                      <p className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>{div.division}</p>
                    </div>
                    <div className="text-right">
                      {div.cap && (
                        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{div.count}/{div.cap}팀</span>
                      )}
                      {isFull && (
                        <Badge variant={tournament.allow_waiting_list ? "warning" : "error"}>
                          {tournament.allow_waiting_list ? "대기" : "마감"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {progressPct !== null && (
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: isFull ? "var(--color-error)" : "var(--color-primary)" }} />
                    </div>
                  )}
                  {false && div.fee !== null && div.fee > 0 && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>{div.fee.toLocaleString()}원</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </>
  );

  return (
    <div>
      {/* 브레드크럼: PC에서만 표시, 모바일은 뒤로가기 버튼이 대신 */}
      <Breadcrumb items={[
        { label: "대회", href: "/tournaments" },
        { label: tournament.name },
      ]} />

      {/* 히어로 배너: 사이드바 정보(참가비/참가신청)를 히어로에 통합 */}
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
        designTemplate={tournament.design_template}
        logoUrl={tournament.logo_url}
        bannerUrl={tournament.banner_url}
        primaryColor={tournament.primary_color}
        secondaryColor={tournament.secondary_color}
        entryFee={tournament.entry_fee ? Number(tournament.entry_fee) : null}
        isRegistrationOpen={isRegistrationOpen}
        tournamentId={id}
        contactPhone={(tournament.settings as Record<string, unknown>)?.contact_phone as string ?? null}
      />

      {/* 1열 레이아웃: 탭 콘텐츠 전체 너비 (사이드바 제거됨) */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          {/* 탭: 개요는 서버 렌더링, 나머지는 클라이언트 lazy loading */}
          <TournamentTabs
            tournamentId={id}
            overviewContent={overviewContent}
          />
        </div>

        {/* 다음 액션 유도: 다른 대회 탐색 */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/tournaments"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-elevated)]"
          >
            <span className="material-symbols-outlined text-base">emoji_events</span>
            다른 대회 보기
          </Link>
        </div>
      </div>

      {/* ========================================
       * 모바일 플로팅 CTA: 접수중일 때만 하단 고정 표시
       * bottom-16 = 하단 네비(h-14) 위, z-40으로 콘텐츠 위에 뜸
       * 히어로에도 참가 신청 버튼이 있지만, 스크롤 후 접근성을 위해 모바일에서 유지
       * ======================================== */}
      {isRegistrationOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 lg:hidden">
          <Link
            href={`/tournaments/${id}/join`}
            className="flex w-full items-center justify-center gap-2 rounded-md py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <span className="material-symbols-outlined text-lg">edit_square</span>
            참가 신청하기
          </Link>
        </div>
      )}
    </div>
  );
}
