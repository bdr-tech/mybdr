"use client";

/* ============================================================
 * TossListItem — 토스 스타일 리스트 아이템 컴포넌트
 *
 * 토스 앱에서 가장 많이 쓰이는 패턴:
 * [원형 아이콘] [제목/부제] [값/화살표]
 *
 * 은행 계좌 목록, 설정 항목, 거래 내역 등에서 동일한 구조 사용.
 * 이 프로젝트에서는 팀 리스트, 커뮤니티 글 등에 활용.
 * ============================================================ */

import React from "react";
import Link from "next/link";

interface TossListItemProps {
  icon?: string;         // Material Symbols 아이콘명 (예: "groups", "sports_basketball")
  iconBg?: string;       // 아이콘 배경색 (CSS 색상값, 예: "var(--color-primary)")
  title: string;         // 메인 제목
  subtitle?: string;     // 부제/설명
  rightText?: string;    // 우측 값 (예: "42W", "12,000원")
  rightSub?: string;     // 우측 부가 정보
  onClick?: () => void;
  href?: string;         // 링크가 있으면 <Link>로 래핑
  showArrow?: boolean;   // 우측 화살표(chevron_right) 표시 여부
}

export function TossListItem({
  icon,
  iconBg = "var(--color-surface)",
  title,
  subtitle,
  rightText,
  rightSub,
  onClick,
  href,
  showArrow = true,
}: TossListItemProps) {
  /* 내부 콘텐츠: 아이콘 + 텍스트 + 우측 영역 */
  const content = (
    <div
      /* py-4 px-1: 토스 리스트 표준 간격
       * border-b: 하단 구분선 (토스는 매우 연한 보더)
       * 호버: 배경색 변화 (surface-bright) */
      className="flex items-center gap-3 py-4 px-5 border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-surface-bright)] rounded-lg cursor-pointer"
      onClick={!href ? onClick : undefined}
    >
      {/* 좌: 원형 아이콘 (40px, 배경색 지정) */}
      {icon && (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <span
            className="material-symbols-outlined text-xl text-white"
          >
            {icon}
          </span>
        </div>
      )}

      {/* 중: 제목 + 부제 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* 우: 값 + 부가 정보 + 화살표 */}
      <div className="flex items-center gap-2 shrink-0">
        {(rightText || rightSub) && (
          <div className="text-right">
            {rightText && (
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                {rightText}
              </p>
            )}
            {rightSub && (
              <p className="text-xs text-[var(--color-text-muted)]">
                {rightSub}
              </p>
            )}
          </div>
        )}
        {/* chevron_right: 클릭 가능한 항목이라는 시각적 힌트 */}
        {showArrow && (
          <span className="material-symbols-outlined text-lg text-[var(--color-text-disabled)]">
            chevron_right
          </span>
        )}
      </div>
    </div>
  );

  /* href가 있으면 Link로 래핑, 없으면 그대로 반환 */
  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
