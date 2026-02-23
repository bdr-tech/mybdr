import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${className}`}>
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,102,255,0.12)] text-[#0066FF]">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-[#6B7280]">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
