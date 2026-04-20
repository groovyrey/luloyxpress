import { Skeleton } from "@/components/Skeleton";

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white font-sans py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs Skeleton */}
        <nav className="flex mb-8">
          <Skeleton className="h-4 w-48" />
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Product Image Skeleton */}
          <Skeleton className="aspect-square w-full rounded-3xl" />

          {/* Product Info Skeleton */}
          <div className="flex flex-col space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="pt-8 border-t border-zinc-100 space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>

            <div className="space-y-4 mt-auto">
              <Skeleton className="h-14 w-full rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
