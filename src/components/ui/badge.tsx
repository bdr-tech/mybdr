type BadgeVariant = "default" | "success" | "error" | "warning" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[rgba(0,102,255,0.12)] text-[#0066FF]",
  success: "bg-[rgba(22,163,74,0.12)] text-[#16A34A]",
  error: "bg-[rgba(220,38,38,0.12)] text-[#DC2626]",
  warning: "bg-[rgba(217,119,6,0.12)] text-[#D97706]",
  info: "bg-[rgba(37,99,235,0.12)] text-[#2563EB]",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${variants[variant]}`}>
      {children}
    </span>
  );
}
