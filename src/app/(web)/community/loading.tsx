import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-[16px] border border-[#E8ECF0] bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-4 w-12 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
