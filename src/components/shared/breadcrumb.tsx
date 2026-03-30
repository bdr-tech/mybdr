/**
 * 브레드크럼 (Breadcrumb) 컴포넌트
 *
 * 현재 페이지의 위치를 계층적으로 표시한다.
 * 예: 대회 > BDR 챔피언십
 *
 * 모바일에서는 숨김(hidden lg:block) — 뒤로가기 버튼이 역할을 대신한다.
 * 마지막 항목은 현재 페이지이므로 링크 없이 텍스트만 표시.
 */

import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    /* 모바일 숨김: 뒤로가기 버튼이 대신함. PC에서만 표시. */
    <nav
      className="hidden lg:block"
      aria-label="브레드크럼"
    >
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {/* 구분자: 첫 번째 항목 앞에는 표시하지 않음 */}
              {index > 0 && (
                <span
                  className="material-symbols-outlined text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  chevron_right
                </span>
              )}

              {/* 마지막 항목: 현재 페이지 (링크 없음, 강조 색상) */}
              {isLast || !item.href ? (
                <span
                  className="font-medium truncate max-w-[200px]"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {item.label}
                </span>
              ) : (
                /* 이전 항목: 클릭 가능한 링크 (회색) */
                <Link
                  href={item.href}
                  className="transition-colors hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
