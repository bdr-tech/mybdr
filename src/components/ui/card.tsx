import { type ReactNode } from "react";

// Card: 공통 카드 컴포넌트
// Phase 4-2: 하드코딩 색상 -> CSS 변수로 전환
// 호버 효과: translate-y(떠오르기) -> 배경색 미세 변화 (WHOOP 스타일)
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-radius-card border border-color-border bg-color-card p-4 sm:p-5 shadow-shadow-card transition-all duration-200 hover:bg-color-card-hover hover:border-color-border-subtle ${className}`}>
      {children}
    </div>
  );
}

// StatCard: 통계 표시용 카드 (아이콘 + 라벨 + 값)
// CSS 변수로 아이콘 배경색과 텍스트 색상 적용
export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-color-primary-light text-color-primary">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-color-text-secondary">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
