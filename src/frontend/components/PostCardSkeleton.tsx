import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <Skeleton className="aspect-video w-full" />
      <div className="flex flex-col gap-2 p-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-2 space-y-2 border-t pt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
    </div>
  );
}
