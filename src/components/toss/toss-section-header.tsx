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
  actionLabel?: string;    // 우측 액션 텍스트 (기본: "전체보기")
  actionHref?: string;     // 우측 액션 링크 URL
}

export function TossSectionHeader({
  title,
  actionLabel = "전체보기",
  actionHref,
}: TossSectionHeaderProps) {
  return (
    /* mb-4: 토스 표준 섹션 헤더 하단 여백 */
    <div className="flex items-center justify-between mb-4">
      {/* 좌: 섹션 제목 — 토스 스타일 굵은 텤스트 */}
      <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
        {title}
      </h3>

      {/* 우: "전체보기 >" 링크 — actionHref가 있을 때만 표시 */}
      {actionHref && (
        <Link
          href={actionHref}
          className="flex items-center gap-0.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
        >
          {actionLabel}
          <span className="material-symbols-outlined text-sm">
            chevron_right
          </span>
        </Link>
      )}
    </div>
  );
}
