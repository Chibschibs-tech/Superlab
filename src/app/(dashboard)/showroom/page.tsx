import { Suspense } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import { ShowroomContent } from "./showroom-content";
import { getProjects, getProjectSignals } from "@/lib/data/projects";
import { getCategories } from "@/lib/data/categories";

export const metadata = {
  title: "Showroom | Supermedia Lab",
  description: "Portfolio des projets en incubation",
};

function ProjectGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-neutral-800/50" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-800/50" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-800/50" />
      </div>
      {/* Grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[16/10] animate-pulse rounded-2xl bg-neutral-800/50"
          />
        ))}
      </div>
    </div>
  );
}

async function ShowroomData() {
  const [projects, categories, signals] = await Promise.all([
    getProjects(),
    getCategories("project"),
    getProjectSignals(),
  ]);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-700 py-16">
        <Sparkles className="h-12 w-12 text-neutral-600" />
        <p className="mt-4 text-lg font-medium text-neutral-400">
          Aucun projet pour le moment
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Les projets apparaîtront ici une fois créés
        </p>
      </div>
    );
  }

  return (
    <ShowroomContent
      projects={projects}
      categories={categories}
      signals={signals}
    />
  );
}

export default function ShowroomPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-white/10">
            <LayoutGrid className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Showroom
            </h1>
            <p className="text-sm text-neutral-400">
              Portfolio des projets en incubation
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Actif &lt;48h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-500/20">
              <span className="text-[8px] text-amber-400">⚠</span>
            </span>
            <span>En retard &gt;14j</span>
          </div>
        </div>
      </div>

      {/* Content with Filters */}
      <Suspense fallback={<ProjectGridSkeleton />}>
        <ShowroomData />
      </Suspense>
    </div>
  );
}
