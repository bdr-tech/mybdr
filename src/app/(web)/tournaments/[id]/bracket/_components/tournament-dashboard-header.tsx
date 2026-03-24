// 대진표 페이지 상단 대시보드 헤더
// "TOURNAMENT DASHBOARD" 대형 제목 + 통계 4칸 카드 + 액션 버튼
// 시안: bdr_2(다크) / bdr_3(라이트) 참조

type DashboardHeaderProps = {
  tournamentName: string;
  totalTeams: number;
  liveMatchCount: number;
  finalsDate: string | null; // 결승전 예정일 (ISO string)
};

// 날짜를 "OCT 24" 형태로 포맷
function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).toUpperCase();
}

export function TournamentDashboardHeader({
  tournamentName,
  totalTeams,
  liveMatchCount,
  finalsDate,
}: DashboardHeaderProps) {
  return (
    <section className="mb-10">
      {/* 제목 + 액션 버튼 영역 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-6">
        <div>
          {/* 대회명을 부제로 표시 */}
          <div
            className="font-bold text-sm mb-1"
            style={{ color: "var(--color-primary)" }}
          >
            {tournamentName}
          </div>
          {/* 메인 타이틀 */}
          <h2
            className="text-3xl sm:text-4xl font-black tracking-tighter uppercase"
            style={{
              color: "var(--color-text-primary)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Tournament Dashboard
          </h2>
        </div>
        {/* 액션 버튼 (데스크톱만 표시) */}
        <div className="hidden sm:flex gap-2">
          <button
            className="px-4 py-2 rounded text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--color-card)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span className="material-symbols-outlined text-base align-middle mr-1">
              download
            </span>
            리포트 다운로드
          </button>
          <button
            className="px-4 py-2 rounded text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "#fff",
            }}
          >
            <span className="material-symbols-outlined text-base align-middle mr-1">
              live_tv
            </span>
            실시간 중계
          </button>
        </div>
      </div>

      {/* 통계 4칸 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 총 참가팀 */}
        <StatCard
          label="총 참가팀"
          value={`${totalTeams} TEAMS`}
          icon="groups"
        />
        {/* 진행중 경기 */}
        <StatCard
          label="진행중인 경기"
          value={`${String(liveMatchCount).padStart(2, "0")} MATCHES`}
          icon="sports_basketball"
          highlight={liveMatchCount > 0}
          badge={liveMatchCount > 0 ? "LIVE" : undefined}
        />
        {/* 누적 관중 - DB에 없으므로 placeholder */}
        <StatCard label="누적 관중" value="-" icon="stadium" />
        {/* 결승전 예정일 */}
        <StatCard
          label="결승전 예정일"
          value={formatShortDate(finalsDate)}
          icon="event"
        />
      </div>
    </section>
  );
}

// 통계 카드 컴포넌트
function StatCard({
  label,
  value,
  icon,
  highlight = false,
  badge,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div
      className="p-5 rounded"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* 라벨 */}
      <div
        className="text-xs font-medium mb-1 uppercase tracking-wider flex items-center gap-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined text-sm">{icon}</span>
        {label}
      </div>
      {/* 값 + 배지 */}
      <div className="flex items-center gap-2">
        <div
          className="text-xl sm:text-2xl font-black"
          style={{
            color: highlight
              ? "var(--color-primary)"
              : "var(--color-text-primary)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {value}
        </div>
        {/* LIVE 배지 */}
        {badge && (
          <span
            className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full animate-pulse"
            style={{
              backgroundColor: "rgba(227, 27, 35, 0.15)",
              color: "var(--color-primary)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
