// 검색 결과 페이지 로딩 스켈레톤
export default function SearchLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 검색바 스켈레톤 */}
      <div className="h-12 w-full rounded-md bg-[var(--color-border)]" />

      {/* 카테고리별 결과 섹션 (3개) */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-24 rounded bg-[var(--color-border)]" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex items-center gap-3 rounded-md bg-[var(--color-border)] p-4">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-surface)]" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-40 rounded bg-[var(--color-surface)]" />
                <div className="h-3 w-28 rounded bg-[var(--color-surface)]" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
