import { Skeleton } from "@/components/ui/skeleton";

export default function PricingLoading() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <Skeleton className="mx-auto h-9 w-48" />
        <Skeleton className="mx-auto h-5 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border border-[#E8ECF0] bg-white p-6 space-y-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-28" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
