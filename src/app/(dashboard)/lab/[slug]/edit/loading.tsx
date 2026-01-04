import { Skeleton } from "@/components/ui/skeleton";

export default function EditorLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-48 mb-1.5" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="h-[280px] rounded-lg" />
          <Skeleton className="h-[240px] rounded-lg" />
        </div>
        <Skeleton className="h-[280px] rounded-lg" />
      </div>
    </div>
  );
}


