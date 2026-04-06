// 유저 프로필 상세 페이지 로딩 스켈레톤
export default function UserDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-[var(--color-border)]" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-40 rounded-lg bg-[var(--color-border)]" />
          <div className="h-4 w-32 rounded bg-[var(--color-border)]" />
        </div>
      </div>

      {/* 스탯 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-md bg-[var(--color-border)]" />
        ))}
      </div>

      {/* 활동 내역 */}
      <div className="space-y-3">
        <div className="h-6 w-28 rounded bg-[var(--color-border)]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-[var(--color-border)]" />
        ))}
      </div>
    </div>
  );
}
