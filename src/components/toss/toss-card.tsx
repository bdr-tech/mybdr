"use client";

/* ============================================================
 * TossCard — 토스 스타일 카드 컴포넌트
 *
 * 토스 앱의 핵심 UI 패턴인 "화이트 카드" 컴포넌트.
 * 그림자로 구분하되 매우 가볍게, border 없이 깔끔하게.
 * 호버 시 살짝 scale + 그림자 증가로 인터랙션 힌트.
 *
 * 사용처: 홈 추천 경기, 대회 카드, 영상 카드 등
 * ============================================================ */

import React from "react";

interface TossCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TossCard({ children, className = "", onClick }: TossCardProps) {
  return (
    <div
      /* 배경: CSS 변수로 다크모드 자동 대응
       * rounded-2xl: 토스 스타일 16px 둥근 모서리
       * p-5: 20px 내부 패딩 (토스 표준 24px보다 약간 좁게, 모바일 최적화)
       * shadow-card: 매우 가벼운 그림자 (globals.css에서 정의)
       * border 없음: 토스는 그림자로만 구분
       * 호버: scale(1.01) + shadow-elevated로 부드러운 인터랙션 */
      className={`bg-[var(--color-card)] rounded-2xl p-6 transition-all duration-200 hover:scale-[1.01] hover:shadow-[var(--shadow-elevated)] ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
