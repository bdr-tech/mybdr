// 대회 대시보드 헤더: 진행률 / LIVE / 핫팀 3카드 레이아웃
// API에서 받은 통계 데이터를 3칸 그리드로 표시

import Link from "next/link";

type DashboardHeaderProps = {
  totalMatches: number;
  completedMatches: number;
  liveMatchCount: number;
  hotTeam: { teamId: string; teamName: string } | null;
};

export function TournamentDashboardHeader({
  totalMatches,
  completedMatches,
  liveMatchCount,
  hotTeam,
}: DashboardHeaderProps) {
  // 진행률 퍼센트 계산 (0으로 나누기 방지)
  const progressPercent =
    totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <section className="mb-8">
      {/* 대시보드 제목 */}
      <h2
        className="mb-4 text-lg font-bold sm:text-xl"
        style={{
          fontFamily: "var(--font-heading)",
          color: "var(--color-text-primary)",
        }}
      >
        대회 대시보드
      </h2>

      {/* 통계 3칸 그리드 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* 카드 1: 대회 진행률 — 완료 경기 / 전체 경기 비율 */}
        <div
          className="rounded-lg border p-3 sm:p-4"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <p
            className="mb-2 text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            진행률
          </p>
          <p
            className="text-lg font-black sm:text-2xl"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-text-primary)",
            }}
          >
            {progressPercent}%
          </p>
          {/* 프로그레스바: 진행률을 시각적으로 표시 */}
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: "var(--color-primary)",
              }}
            />
          </div>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {completedMatches}/{totalMatches} 경기
          </p>
        </div>

        {/* 카드 2: LIVE 경기 수 — 현재 진행중인 경기 */}
        <div
          className="rounded-lg border p-3 sm:p-4"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <p
            className="mb-2 text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            LIVE
          </p>
          <p
            className="text-lg font-black sm:text-2xl"
            style={{
              fontFamily: "var(--font-heading)",
              color:
                liveMatchCount > 0
                  ? "var(--color-primary)"
                  : "var(--color-text-primary)",
            }}
          >
            {liveMatchCount > 0 ? `${liveMatchCount}경기` : "-"}
          </p>
          {/* LIVE 경기가 있을 때만 펄스 애니메이션 배지 표시 */}
          {liveMatchCount > 0 && (
            <span
              className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold animate-pulse"
              style={{
                backgroundColor: "rgba(227,27,35,0.15)",
                color: "var(--color-primary)",
              }}
            >
              LIVE NOW
            </span>
          )}
        </div>

        {/* 카드 3: 핫팀 — 승률 1위 팀, 클릭 시 팀 페이지 이동 */}
        <Link
          href={hotTeam ? `/teams/${hotTeam.teamId}` : "#"}
          className="rounded-lg border p-3 sm:p-4 transition-colors hover:opacity-80"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <p
            className="mb-2 text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            HOT
          </p>
          <p
            className="text-sm font-bold truncate sm:text-base"
            style={{ color: "var(--color-text-primary)" }}
          >
            {hotTeam?.teamName ?? "-"}
          </p>
          {hotTeam && (
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              최고 성적팀 →
            </p>
          )}
        </Link>
      </div>
    </section>
  );
}
