import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "cta";

// 각 variant별 스타일 정의
// Phase 4-2: 하드코딩 색상 -> CSS 변수로 전환
// cta: 웜 오렌지(#F4A261)로 변경 (기존 빨간색 #E31B23에서)
const variants: Record<Variant, string> = {
  // primary: 진한 텍스트색 배경 + 흰 텍스트
  primary:
    "bg-color-text-primary text-color-text-on-primary font-bold hover:opacity-85",
  // cta(주요 액션): 웜 오렌지 배경 + 흰 텍스트
  cta:
    "bg-color-accent text-color-text-on-primary font-bold hover:bg-color-accent-hover",
  // secondary: 카드 배경 + 테두리 스타일
  secondary:
    "bg-color-card text-color-text-primary border-2 border-color-text-primary font-bold hover:bg-color-card-hover",
  // ghost: 텍스트만 보이는 버튼 (배경 없음)
  ghost:
    "text-color-primary font-bold hover:bg-color-primary-light",
  // danger: 위험 동작용 (삭제, 탈퇴 등)
  danger:
    "bg-color-error/20 text-color-error font-bold hover:bg-color-error/30",
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
  return (
    <button
      // 공통 스타일 + variant별 스타일 + 커스텀 className
      // focus-visible: 키보드 접근성 (Tab 키로 포커스 시 링 표시)
      className={`rounded-[10px] px-6 py-3 text-sm min-h-[44px] transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-primary focus-visible:ring-offset-2 ${variants[variant]} ${className}`}
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
