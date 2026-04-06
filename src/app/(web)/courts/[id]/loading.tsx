// 코트 상세 페이지 로딩 스켈레톤
export default function CourtDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 히어로 이미지 스켈레톤 */}
      <div className="h-48 md:h-64 rounded-md bg-[var(--color-border)]" />

      {/* 코트 이름 + 주소 */}
      <div className="space-y-2">
        <div className="h-8 w-2/3 rounded-lg bg-[var(--color-border)]" />
        <div className="h-5 w-1/2 rounded bg-[var(--color-border)]" />
      </div>

      {/* 태그/배지 스켈레톤 */}
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-[var(--color-border)]" />
        <div className="h-6 w-20 rounded-full bg-[var(--color-border)]" />
        <div className="h-6 w-14 rounded-full bg-[var(--color-border)]" />
      </div>

      {/* 정보 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40 rounded-md bg-[var(--color-border)]" />
        <div className="h-40 rounded-md bg-[var(--color-border)]" />
      </div>

      {/* 리뷰 섹션 스켈레톤 */}
      <div className="space-y-3">
        <div className="h-6 w-24 rounded bg-[var(--color-border)]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-md bg-[var(--color-border)]" />
        ))}
      </div>
    </div>
  );
}
