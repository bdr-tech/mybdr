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
      className={`bg-[var(--color-card)] rounded-md border border-[var(--color-border)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-primary hover:border-[var(--color-primary)] group relative overflow-hidden ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      {/* 2K 스타일 오버레이 그라디언트 (기본 투명, 그룹 호버 시 살짝 등장) */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--color-surface)] opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none" />
      
      {/* 실제 콘텐츠 영역 */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
