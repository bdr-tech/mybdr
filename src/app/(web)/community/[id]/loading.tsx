// 커뮤니티 글 상세 페이지 로딩 스켈레톤
export default function CommunityDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 카테고리 배지 */}
      <div className="h-6 w-16 rounded-full bg-[var(--color-border)]" />

      {/* 제목 */}
      <div className="h-8 w-3/4 rounded-lg bg-[var(--color-border)]" />

      {/* 작성자 정보 */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-[var(--color-border)]" />
        <div className="h-4 w-24 rounded bg-[var(--color-border)]" />
        <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
      </div>

      {/* 본문 스켈레톤 */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-[var(--color-border)]" style={{ width: `${85 - i * 8}%` }} />
        ))}
      </div>

      {/* 좋아요/댓글 액션 바 */}
      <div className="flex gap-4 border-t border-[var(--color-border)] pt-4">
        <div className="h-8 w-20 rounded bg-[var(--color-border)]" />
        <div className="h-8 w-20 rounded bg-[var(--color-border)]" />
      </div>

      {/* 댓글 섹션 */}
      <div className="space-y-3">
        <div className="h-5 w-20 rounded bg-[var(--color-border)]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-md bg-[var(--color-border)]" />
        ))}
      </div>
    </div>
  );
}
