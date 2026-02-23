type BadgeVariant = "default" | "success" | "error" | "warning" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[rgba(0,102,255,0.12)] text-[#0066FF]",
  success: "bg-[rgba(74,222,128,0.2)] text-[#4ADE80]",
  error: "bg-[rgba(239,68,68,0.2)] text-[#EF4444]",
  warning: "bg-[rgba(251,191,36,0.2)] text-[#FBBF24]",
  info: "bg-[rgba(96,165,250,0.2)] text-[#60A5FA]",
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
