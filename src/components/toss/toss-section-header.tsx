"use client";

/* ============================================================
 * TossSectionHeader — 토스 스타일 섹션 헤더 컴포넌트
 *
 * 토스 앱의 "섹션 제목 + 전체보기 >" 패턴.
 * 화면 곳곳에서 반복되는 패턴이라 컴포넌트로 추출.
 *
 * 좌: 섹션 제목 (text-lg font-bold, 토스 헤드라인 색상)
 * 우: "전체보기 >" 링크 (text-sm, primary 색상)
 * ============================================================ */

import React from "react";
import Link from "next/link";

interface TossSectionHeaderProps {
  title: string;           // 섹션 제목
  actionLabel?: string;    // 우측 액션 텍스트 (기본: "VIEW ALL")
  actionHref?: string;     // 우측 액션 링크 URL
}

export function TossSectionHeader({
  title,
  actionLabel = "VIEW ALL",
  actionHref,
}: TossSectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-4 pb-2 border-b-2 border-[var(--color-border)]">
      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[var(--color-text-primary)] drop-shadow-sm">
        {title}
      </h3>

      {actionHref && (
        <Link
          href={actionHref}
          className="flex items-center gap-0.5 text-[10px] font-black text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] uppercase tracking-wide"
        >
          {actionLabel}
          <span className="material-symbols-outlined text-sm font-bold">
            chevron_right
          </span>
        </Link>
      )}
    </div>
  );
}
