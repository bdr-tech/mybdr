/**
 * UserStatsSection - 타인 프로필 시즌 상세 데이터
 *
 * 디자인 시안(bdr_2): 4칸 카드(평균 득점/어시스트/리바운드/스틸)
 * + 야투/3점슛 성공률 프로그레스 바
 * - 야투/3점슛 성공률은 DB에 없으므로 숨김 처리
 */

interface UserStatsSectionProps {
  avgPoints: number;
  avgAssists: number;
  avgRebounds: number;
  avgSteals: number;
  gamesPlayed: number;
}

/** 개별 스탯 카드 */
function StatCard({
  label,
  value,
  barColor,
  /** 바의 너비 퍼센트 (시각적 표현용) */
  barPercent,
}: {
  label: string;
  value: number;
  barColor: string;
  barPercent: number;
}) {
  return (
    <div
      className="p-4 rounded"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
      <p
        className="text-2xl font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value.toFixed(1)}
      </p>
      {/* 프로그레스 바 */}
      <div
        className="w-full h-1.5 mt-3 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-surface-high)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(barPercent, 100)}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}

export function UserStatsSection({
  avgPoints,
  avgAssists,
  avgRebounds,
  avgSteals,
  gamesPlayed,
}: UserStatsSectionProps) {
  return (
    <div
      className="rounded-lg border p-5 h-full"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 헤더 — 페이지 h1(닉네임) 바로 아래 섹션이므로 h2 */}
      <div className="flex justify-between items-center mb-5">
        <h2
          className="font-bold text-lg"
          style={{ color: "var(--color-text-primary)" }}
        >
          시즌 상세 데이터
        </h2>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {gamesPlayed}경기
        </span>
      </div>

      {/* 4칸 스탯 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="평균 득점"
          value={avgPoints}
          barColor="var(--color-primary)"
          barPercent={normalize(avgPoints, 30)}
        />
        <StatCard
          label="평균 어시스트"
          value={avgAssists}
          barColor="var(--color-tertiary)"
          barPercent={normalize(avgAssists, 15)}
        />
        <StatCard
          label="리바운드"
          value={avgRebounds}
          barColor="var(--color-text-secondary)"
          barPercent={normalize(avgRebounds, 15)}
        />
        <StatCard
          label="스틸"
          value={avgSteals}
          barColor="var(--color-primary)"
          barPercent={normalize(avgSteals, 5)}
        />
      </div>
    </div>
  );
}

/** 스탯을 0~100으로 정규화 */
function normalize(value: number, maxBase: number): number {
  return Math.min(Math.round((value / maxBase) * 100), 100);
}
