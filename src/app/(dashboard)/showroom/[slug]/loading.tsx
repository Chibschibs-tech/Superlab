export default function ProjectLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Back Button Skeleton */}
      <div className="h-5 w-40 rounded bg-neutral-800" />

      {/* Video Hero Skeleton */}
      <div className="aspect-video w-full rounded-2xl bg-neutral-800" />

      {/* Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-6 lg:col-span-2">
          <div className="h-8 w-24 rounded-full bg-neutral-800" />
          <div className="h-12 w-3/4 rounded bg-neutral-800" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-neutral-800" />
            <div className="h-4 w-5/6 rounded bg-neutral-800" />
            <div className="h-4 w-4/6 rounded bg-neutral-800" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 rounded-xl bg-neutral-800" />
            <div className="h-24 rounded-xl bg-neutral-800" />
            <div className="h-24 rounded-xl bg-neutral-800" />
          </div>
        </div>

        {/* Right */}
        <div className="h-80 rounded-2xl bg-neutral-800" />
      </div>
    </div>
  );
}

