export default function GamesLoading() {
  return (
    <div className="animate-pulse">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-20 rounded bg-[var(--color-border)]" />
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-full bg-[var(--color-border)]" />
          <div className="h-9 w-24 rounded-full bg-[var(--color-border)]" />
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-full bg-[var(--color-border)]" />
        ))}
      </div>

      {/* 카드 그리드 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[16px] bg-[var(--color-card)] border border-[var(--color-border)] p-4">
            <div className="mb-2 h-5 w-3/4 rounded bg-[var(--color-border)]" />
            <div className="h-4 w-1/2 rounded bg-[var(--color-border)]" />
            <div className="mt-3 h-4 w-2/3 rounded bg-[var(--color-border)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
