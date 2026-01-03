import { LayoutGrid } from "lucide-react";

export default function ShowroomPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <LayoutGrid className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Showroom</h1>
          <p className="text-sm text-muted-foreground">
            Browse all projects in your portfolio
          </p>
        </div>
      </div>

      {/* Placeholder Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="group relative aspect-video overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">
                Project {i + 1}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

