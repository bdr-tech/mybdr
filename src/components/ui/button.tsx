import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#F4A261] text-[#0A0A0A] font-semibold hover:bg-[#E8934E]",
  secondary:
    "bg-[#2A2A2A] text-white border border-[#2A2A2A] hover:bg-[#252525]",
  ghost:
    "text-[#F4A261] hover:bg-[rgba(244,162,97,0.12)]",
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
