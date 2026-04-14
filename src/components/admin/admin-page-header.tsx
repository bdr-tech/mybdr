import { type ReactNode } from "react";

// 관리자 페이지 공통 헤더 컴포넌트
// 모든 admin 페이지에서 제목 + 부제 + 검색 + 액션 버튼을 통일된 스타일로 표시
interface AdminPageHeaderProps {
  title: string;
  subtitle?: string; // "전체 42개" 같은 부제
  searchPlaceholder?: string;
  searchName?: string; // form input name (기본값 "q")
  searchDefaultValue?: string;
  actions?: ReactNode; // 우측 추가 버튼 등
}

export function AdminPageHeader({
  title,
  subtitle,
  searchPlaceholder,
  searchName = "q",
  searchDefaultValue,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* 좌측: 제목 + 부제 */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
        )}
      </div>

      {/* 우측: 검색 + 액션 */}
      <div className="flex items-center gap-2">
        {searchPlaceholder && (
          <form method="GET" className="flex gap-2">
            <input
              name={searchName}
              defaultValue={searchDefaultValue ?? ""}
              placeholder={searchPlaceholder}
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              className="rounded-[10px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)]"
            >
              검색
            </button>
          </form>
        )}
        {actions}
      </div>
    </div>
  );
}
