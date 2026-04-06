type BadgeVariant = "default" | "success" | "error" | "warning" | "info" | "secondary";

// 뱃지 variant별 스타일 정의
// 배경은 각 색상의 12% 투명도, 텍스트는 해당 색상 그대로
// secondary: 종료/비활성 상태용 회색 뱃지
const variants: Record<BadgeVariant, string> = {
  default: "bg-color-primary-light text-color-primary",
  success: "bg-color-success/12 text-color-success",
  error:   "bg-color-error/12 text-color-error",
  warning: "bg-color-warning/12 text-color-warning",
  info:    "bg-color-info/12 text-color-info",
  secondary: "bg-[var(--color-elevated)] text-[var(--color-text-muted)]",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span className={`inline-flex rounded-sm px-3 py-1 text-[11px] font-black uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
}
