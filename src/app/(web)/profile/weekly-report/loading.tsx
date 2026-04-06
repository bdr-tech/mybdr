// 주간 운동 리포트 페이지 로딩 스켈레톤
export default function WeeklyReportLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 페이지 제목 + 기간 */}
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-lg bg-[var(--color-border)]" />
        <div className="h-4 w-48 rounded bg-[var(--color-border)]" />
      </div>

      {/* 요약 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-2"
          >
            <div className="h-4 w-16 rounded bg-[var(--color-border)]" />
            <div className="h-8 w-20 rounded bg-[var(--color-border)]" />
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="h-48 rounded-md bg-[var(--color-border)]" />

      {/* 운동 기록 리스트 */}
      <div className="space-y-3">
        <div className="h-5 w-24 rounded bg-[var(--color-border)]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-[var(--color-border)]" />
        ))}
      </div>
    </div>
  );
}
