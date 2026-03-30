import { type ReactNode } from "react";
import Link from "next/link";

interface SectionWrapperProps {
  title: string;
  href?: string;
  children: ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
}

export function SectionWrapper({ title, href, children, emptyText, isEmpty }: SectionWrapperProps) {
  return (
    /* 카드 외형: CSS 변수 (다크모드 자동 대응) */
    <div className="rounded-[20px] border p-4 sm:p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-card)' }}>
      <div className="mb-3 flex items-center justify-between">
        <h2
          className="text-base font-bold uppercase tracking-wide"
          style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-primary)' }}
        >
          {title}
        </h2>
        {href && !isEmpty && (
          /* "자세히 보기" 링크: accent 색상 */
          <Link
            href={href}
            className="flex items-center gap-0.5 text-xs font-medium transition-colors"
            style={{ color: 'var(--color-accent)' }}
          >
            자세히 보기
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        )}
      </div>
      {isEmpty ? (
        <p className="py-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>{emptyText ?? "데이터가 없습니다."}</p>
      ) : (
        children
      )}
    </div>
  );
}
