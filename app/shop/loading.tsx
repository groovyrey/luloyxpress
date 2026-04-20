import { ProductCardSkeleton, Skeleton } from "@/components/Skeleton";

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-white font-sans py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-14 w-full md:w-96 rounded-2xl" />
        </div>

        {/* Category Filter Skeleton */}
        <div className="mb-12 flex gap-2 overflow-x-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>

        <div className="space-y-24">
          {[1, 2].map((section) => (
            <section key={section}>
              <div className="flex items-end justify-between mb-8 border-b border-zinc-100 pb-6">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
                {[1, 2, 3, 4].map((i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
