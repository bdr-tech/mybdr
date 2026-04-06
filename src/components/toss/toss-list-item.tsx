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
  icon?: string;         
  iconBg?: string;       
  title: string;         
  subtitle?: string;     
  rightText?: string;    
  rightSub?: string;     
  onClick?: () => void;
  href?: string;         
  showArrow?: boolean;   
}

export function TossListItem({
  icon,
  iconBg = "var(--color-text-muted)",
  title,
  subtitle,
  rightText,
  rightSub,
  onClick,
  href,
  showArrow = true,
}: TossListItemProps) {
  const content = (
    <div
      className="flex items-center gap-3 p-2 bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-card)] hover:to-[var(--color-surface-bright)] border-l-4 border-transparent hover:border-[var(--color-primary)] transition-all duration-200 group rounded-none cursor-pointer mb-2"
      onClick={!href ? onClick : undefined}
    >
      {/* 아바타 아이콘 배경 (기울임 효과 제거, 단정하고 약간의 각진 스타일 유지) */}
      {icon && (
        <div
          className="w-10 h-10 flex-none flex items-center justify-center rounded-md shadow-inner"
          style={{ background: `linear-gradient(135deg, ${iconBg} 0%, rgba(0,0,0,0.5) 100%)` }}
        >
          <span className="material-symbols-outlined text-[20px] text-white opacity-90">
            {icon}
          </span>
        </div>
      )}

      {/* 중앙 텍스트 영역 (이탤릭, 고밀도) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-baseline w-full">
          {/* 이탤릭체 폰트 우측 잘림 방지를 위해 pr-1 요소 추가 */}
          <p className="text-sm font-extrabold uppercase truncate text-[var(--color-text-primary)] tracking-tight pr-1">
            {title}
          </p>
          {rightText && (
            <p className="text-sm font-black text-[var(--color-primary)] shrink-0 ml-2 pr-1">
              {rightText}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center mt-0.5">
          {subtitle && (
             <p className="text-[10px] font-bold text-[var(--color-text-muted)] truncate uppercase tracking-wider">
               {subtitle}
             </p>
          )}
          {/* 부가 정보(우측 하단)는 네온 뱃지로 처리 */}
          {rightSub && (
            <span className="text-[9px] font-black text-[var(--color-card)] bg-[var(--color-text-primary)] px-2 py-0.5 rounded-sm ml-2 shrink-0">
               {rightSub}
            </span>
          )}
        </div>
      </div>
      
      {showArrow && (
        <div className="flex items-center shrink-0 text-[var(--color-text-disabled)] group-hover:text-[var(--color-primary)] transition-colors">
          <span className="material-symbols-outlined text-lg font-bold">chevron_right</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {content}
      </Link>
    );
  }

  return content;
}
