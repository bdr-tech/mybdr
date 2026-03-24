// Skeleton: 로딩 시 콘텐츠 자리를 채우는 플레이스홀더
// Phase 4-2: 하드코딩 색상(#E8ECF0) -> CSS 변수로 전환
// 다크 모드에서 자동으로 어두운 배경색이 적용됨
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[12px] bg-color-border ${className ?? ""}`}
    />
  );
}
