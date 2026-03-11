export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[12px] bg-[#E8ECF0] ${className ?? ""}`}
    />
  );
}
