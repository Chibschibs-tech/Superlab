import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPageLoading() {
  return <AnalyticsLoading />;
}

export function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Tabs skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Top cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] rounded-lg" />
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    </div>
  );
}


