import { Suspense } from "react";
import { FlaskConical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LabWorkspace } from "./lab-workspace";
import { getProjects } from "@/lib/data/projects";

export const metadata = {
  title: "Lab | Supermedia Lab",
  description: "Espace de travail des projets",
};

async function LabData() {
  const projects = await getProjects();
  return <LabWorkspace projects={projects} />;
}

function LoadingSkeleton() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Projects List Skeleton */}
      <div className="w-80 space-y-2">
        <Skeleton className="h-10 rounded-lg bg-white/5" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
      {/* Workspace Skeleton */}
      <div className="flex-1">
        <Skeleton className="h-full rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export default function LabPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-pink-600/20 p-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Lab Workspace
            </h1>
            <p className="text-sm text-neutral-400">
              Gérez et développez vos projets
            </p>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <Suspense fallback={<LoadingSkeleton />}>
        <LabData />
      </Suspense>
    </div>
  );
}
