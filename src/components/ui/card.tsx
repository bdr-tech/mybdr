import { type ReactNode } from "react";

// Card: 공통 카드 컴포넌트
// CSS 변수를 인라인 style로 적용 (Tailwind CSS 4 호환)
// 호버 효과: 배경색 미세 변화
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border p-4 sm:p-5 transition-all duration-200 ${className}`}
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
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
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
