// 경기 상세 페이지 로딩 스켈레톤 - 새 2열 레이아웃에 맞춤

export default function GameDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 히어로 배너 스켈레톤 */}
      <div className="h-64 md:h-[400px] rounded-md bg-[var(--color-border)]" />

      {/* 배지 스켈레톤 */}
      <div className="flex gap-2">
        <div className="h-6 w-14 rounded-full bg-[var(--color-border)]" />
        <div className="h-6 w-14 rounded-full bg-[var(--color-border)]" />
      </div>

      {/* 제목 스켈레톤 */}
      <div className="h-8 w-2/3 rounded-lg bg-[var(--color-border)]" />

      {/* 2열 레이아웃 스켈레톤 */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* 좌측: Amenities + Rules */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-48 rounded-md bg-[var(--color-border)]" />
            <div className="h-48 rounded-md bg-[var(--color-border)]" />
          </div>
          {/* 참여자 스켈레톤 */}
          <div className="h-32 rounded-md bg-[var(--color-border)]" />
        </div>

        {/* 우측: 가격 카드 */}
        <div className="space-y-6">
          <div className="h-80 rounded-md bg-[var(--color-border)]" />
          <div className="h-32 rounded-md bg-[var(--color-border)]" />
        </div>
      </div>
    </div>
  );
}
