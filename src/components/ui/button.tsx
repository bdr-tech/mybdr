import React, { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "cta";

// 각 variant별 스타일 정의
// Phase 4-2: 하드코딩 색상 -> CSS 변수로 전환
// cta: 웜 오렌지(#F4A261)로 변경 (기존 빨간색 #E31B23에서)
const variants: Record<Variant, string> = {
  primary:
    "font-bold hover:opacity-85",
  cta:
    "font-bold hover:opacity-90",
  secondary:
    "font-bold border-2",
  ghost:
    "font-bold",
  danger:
    "font-bold",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  loading = false,
  ...props
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantStyles: Record<Variant, React.CSSProperties> = {
    primary: { backgroundColor: 'var(--color-text-primary)', color: 'var(--color-on-text-primary)' },
    cta: { backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)' },
    secondary: { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--color-primary)' },
    danger: { backgroundColor: 'rgba(239,68,68,0.15)', color: 'var(--color-error)' },
  };

  return (
    <button
      className={`rounded-[10px] px-6 py-3 text-sm min-h-[44px] transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variants[variant]} ${className}`}
      style={variantStyles[variant]}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          {/* 로딩 스피너 애니메이션 */}
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
