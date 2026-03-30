import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import Link from "next/link";

/* ============================================================
 * 주최자 대시보드 — /tournament-admin
 *
 * 내 대회 목록 + 참가 현황(팀수/입금/대기) 카드 표시.
 * TossCard + 리스트 패턴으로 핵심 통계를 한눈에 파악.
 * 서버 컴포넌트에서 Prisma로 직접 쿼리 (API 호출 X).
 * ============================================================ */

export const dynamic = "force-dynamic";

// 대회 상태 4종 통일 매핑
const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  draft: { label: "준비중", color: "var(--color-text-muted)" },
  upcoming: { label: "준비중", color: "var(--color-text-muted)" },
  registration: { label: "접수중", color: "var(--color-info)" },
  active: { label: "접수중", color: "var(--color-info)" },
  open: { label: "접수중", color: "var(--color-info)" },
  in_progress: { label: "진행중", color: "var(--color-primary)" },
  live: { label: "진행중", color: "var(--color-primary)" },
  ongoing: { label: "진행중", color: "var(--color-primary)" },
  completed: { label: "종료", color: "var(--color-text-disabled)" },
  ended: { label: "종료", color: "var(--color-text-disabled)" },
  cancelled: { label: "종료", color: "var(--color-text-disabled)" },
};

export default async function TournamentAdminDashboard() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const organizerId = BigInt(session.sub);

  // 내 대회 목록 + 각 대회별 참가팀 통계를 한번에 가져오기
  const myTournaments = await prisma.tournament.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      status: true,
      maxTeams: true,
      teams_count: true,
      startDate: true,
      createdAt: true,
      // 참가팀 상세 현황을 집계하기 위해 tournamentTeams를 가져옴
      tournamentTeams: {
        select: {
          status: true,
          payment_status: true,
        },
      },
    },
  });

  // 시리즈 카운트
  const seriesCount = await prisma.tournament_series.count({
    where: { organizer_id: organizerId },
  });

  // 전체 통계 계산
  const totalTournaments = myTournaments.length;
  const activeTournaments = myTournaments.filter(
    (t) => ["active", "registration", "in_progress", "live", "ongoing"].includes(t.status || "")
  ).length;
  const completedTournaments = myTournaments.filter(
    (t) => ["completed", "ended", "cancelled"].includes(t.status || "")
  ).length;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-extrabold uppercase tracking-wide"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          대회 관리 대시보드
        </h1>
        <Link
          href="/tournament-admin/tournaments/new/wizard"
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          새 대회 만들기
        </Link>
      </div>

      {/* 요약 통계 카드 3개 — 토스 스타일 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "내 대회", value: totalTournaments, icon: "emoji_events", color: "var(--color-info)" },
          { label: "진행 중", value: activeTournaments, icon: "play_circle", color: "var(--color-primary)" },
          { label: "완료", value: completedTournaments, icon: "check_circle", color: "var(--color-text-muted)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
          >
            <span
              className="material-symbols-outlined mb-1 block text-2xl"
              style={{ color: stat.color }}
            >
              {stat.icon}
            </span>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* 내 대회 목록 — 각 대회별 참가 현황 카드 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            내 대회
          </h2>
          <Link
            href="/tournament-admin/tournaments"
            className="flex items-center gap-0.5 text-sm font-medium transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            전체보기
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>

        {myTournaments.length === 0 ? (
          /* 대회가 없을 때 빈 상태 */
          <div
            className="rounded-2xl py-12 text-center"
            style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
          >
            <span
              className="material-symbols-outlined mb-3 block text-4xl"
              style={{ color: "var(--color-text-disabled)" }}
            >
              emoji_events
            </span>
            <p
              className="text-base font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              아직 대회가 없어요
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              첫 대회를 만들어보세요
            </p>
            <Link
              href="/tournament-admin/tournaments/new/wizard"
              className="mt-4 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              대회 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myTournaments.map((tournament) => {
              // 각 대회별 참가팀 통계 집계
              const teams = tournament.tournamentTeams || [];
              const totalTeams = teams.length;
              const approvedTeams = teams.filter((t) => t.status === "approved").length;
              const pendingTeams = teams.filter((t) => t.status === "pending").length;
              const paidTeams = teams.filter((t) => t.payment_status === "paid").length;

              const statusInfo = STATUS_DISPLAY[tournament.status || "draft"] || STATUS_DISPLAY.draft;
              const maxTeams = tournament.maxTeams || 0;

              return (
                <div
                  key={tournament.id}
                  className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]"
                  style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
                >
                  {/* 상단: 대회명 + 상태 뱃지 */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-base font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {tournament.name}
                      </h3>
                      {tournament.startDate && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(tournament.startDate).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    {/* 상태 뱃지 */}
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        color: statusInfo.color,
                        backgroundColor: "var(--color-surface)",
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* 중간: 참가 현황 3개 지표 */}
                  <div
                    className="mb-3 grid grid-cols-3 gap-2 rounded-xl p-3"
                    style={{ backgroundColor: "var(--color-surface)" }}
                  >
                    {/* 팀수: 승인된 팀 / 최대 팀 */}
                    <div className="text-center">
                      <p
                        className="text-lg font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {approvedTeams}
                        {maxTeams > 0 && (
                          <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                            /{maxTeams}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        참가팀
                      </p>
                    </div>
                    {/* 입금 확인 */}
                    <div className="text-center">
                      <p
                        className="text-lg font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {paidTeams}
                        {totalTeams > 0 && (
                          <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                            /{totalTeams}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        입금확인
                      </p>
                    </div>
                    {/* 신청 대기 */}
                    <div className="text-center">
                      <p
                        className="text-lg font-bold"
                        style={{
                          color: pendingTeams > 0 ? "var(--color-primary)" : "var(--color-text-primary)",
                        }}
                      >
                        {pendingTeams}
                        <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                          건
                        </span>
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        대기중
                      </p>
                    </div>
                  </div>

                  {/* 하단: 관리하기 버튼 */}
                  <Link
                    href={`/tournament-admin/tournaments/${tournament.id}`}
                    className="flex w-full items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-primary)",
                    }}
                  >
                    관리하기
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 빠른 시작 섹션 */}
      <div>
        <h2
          className="mb-3 text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          빠른 시작
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/tournament-admin/tournaments/new/wizard", icon: "add_circle", label: "대회 만들기" },
            { href: "/tournament-admin/tournaments", icon: "list", label: "내 대회 목록" },
            { href: "/tournament-admin/templates", icon: "dashboard_customize", label: "템플릿 둘러보기" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 rounded-2xl p-5 text-center transition-all duration-200 hover:scale-[1.02]"
              style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
            >
              <span
                className="material-symbols-outlined text-3xl"
                style={{ color: "var(--color-primary)" }}
              >
                {item.icon}
              </span>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {item.label}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* 시리즈 섹션 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            내 시리즈
          </h2>
          <Link
            href="/tournament-admin/series"
            className="flex items-center gap-0.5 text-sm font-medium transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            전체보기
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>

        {seriesCount > 0 ? (
          <Link
            href="/tournament-admin/series"
            className="flex items-center justify-between rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]"
            style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-info)" }}>
                  folder_open
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  시리즈 {seriesCount}개
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  정기 대회를 시리즈로 관리하세요
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-text-disabled)" }}>
              chevron_right
            </span>
          </Link>
        ) : (
          <div
            className="rounded-2xl py-8 text-center"
            style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
          >
            <span
              className="material-symbols-outlined mb-2 block text-3xl"
              style={{ color: "var(--color-text-disabled)" }}
            >
              folder_open
            </span>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              정기 대회를 시리즈로 관리해보세요
            </p>
            <Link
              href="/tournament-admin/series/new"
              className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              첫 시리즈 만들기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
