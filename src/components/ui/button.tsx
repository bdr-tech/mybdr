import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "cta";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#1B3C87] text-white font-semibold hover:bg-[#142D6B]",
  secondary:
    "bg-[#FFFFFF] text-[#374151] border border-[#CBD5E1] hover:bg-[#F5F6FA] hover:border-[#1B3C87]",
  ghost:
    "text-[#E31B23] hover:bg-[rgba(27,60,135,0.12)]",
  danger:
    "bg-[rgba(220,38,38,0.2)] text-[#DC2626] hover:bg-[rgba(220,38,38,0.3)]",
  cta:
    "bg-[#E31B23] text-white font-semibold hover:bg-[#C8101E]",
};

export function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}: {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-full px-6 py-3 text-sm min-h-[44px] transition-all disabled:opacity-50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3C87] focus-visible:ring-offset-2 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
