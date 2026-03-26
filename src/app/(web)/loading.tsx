import { Skeleton } from "@/components/ui/skeleton";

export default function WebLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <Skeleton className="h-48 rounded-[24px]" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[16px]" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-[16px]" />
        ))}
      </div>
    </div>
  );
}
