"use client";

/* ============================================================
 * TossButton — 토스 스타일 버튼 컴포넌트
 *
 * 토스 앱 버튼의 3가지 변형:
 * 1. primary: 풀와이드 CTA (h-14, 토스 블루, 흰 글씨)
 * 2. secondary: 보조 버튼 (surface 배경, primary 글씨)
 * 3. small: 작은 인라인 버튼 (h-10, 라운드)
 *
 * 토스 디자인 원칙: "한 화면에 CTA는 1개만"
 * primary는 페이지당 1개만 사용을 권장.
 * ============================================================ */

import React from "react";

interface TossButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "small";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;  // 풀와이드 여부 (기본: primary만 true)
}

export function TossButton({
  children,
  variant = "primary",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  fullWidth,
}: TossButtonProps) {
  /* 변형별 기본 스타일 */
  const baseStyles = "font-black uppercase tracking-widest transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    /* primary: 풀와이드 CTA
     * h-14 (56px): 토스 표준 CTA 높이
     * rounded-sm: 살짝 둥근 버튼 모서리
     * bg-primary: 토스 블루 배경 */
    primary: `h-14 rounded-sm bg-[var(--color-primary)] text-white text-sm shadow-glow-primary hover:bg-[var(--color-primary-hover)] ${fullWidth !== false ? "w-full" : ""}`,

    secondary: `h-14 rounded-sm border border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)] text-sm hover:bg-[var(--color-surface-bright)] ${fullWidth ? "w-full" : ""}`,

    small: `h-10 rounded-sm px-4 bg-[var(--color-primary)] text-[11px] text-white hover:bg-[var(--color-primary-hover)] ${fullWidth ? "w-full" : ""}`,
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
