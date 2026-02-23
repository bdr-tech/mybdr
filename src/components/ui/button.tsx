import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#0066FF] text-white font-semibold hover:bg-[#0052CC]",
  secondary:
    "bg-[#FFFFFF] text-[#374151] border border-[#CBD5E1] hover:bg-[#F5F7FA] hover:border-[#0066FF]",
  ghost:
    "text-[#F4A261] hover:bg-[rgba(0,102,255,0.12)]",
  danger:
    "bg-[rgba(239,68,68,0.2)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.3)]",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-full px-6 py-3 text-sm transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
