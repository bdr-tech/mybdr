import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[16px] bg-[#1A1A1A] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] ${className}`}>
      {children}
    </div>
  );
}

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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(244,162,97,0.12)] text-[#F4A261]">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-[#A0A0A0]">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
