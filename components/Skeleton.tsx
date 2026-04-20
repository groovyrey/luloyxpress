export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-zinc-200 ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-5 w-full" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
