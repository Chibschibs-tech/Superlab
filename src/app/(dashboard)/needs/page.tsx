import { Suspense } from "react";
import { Target } from "lucide-react";
import { getNeeds } from "@/lib/data/needs";
import { NeedsContent } from "./needs-content";

export const metadata = {
  title: "Besoins | Supermedia Lab",
  description: "Demandes et besoins des projets",
};

function NeedsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-800/50" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-800/50" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-800/50" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-2xl bg-neutral-800/50"
        />
      ))}
    </div>
  );
}

async function NeedsData() {
  const needs = await getNeeds();
  return <NeedsContent needs={needs} />;
}

export default function NeedsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-1 ring-white/10">
          <Target className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Besoins
          </h1>
          <p className="text-sm text-neutral-400">
            Demandes de ressources et support
          </p>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<NeedsSkeleton />}>
        <NeedsData />
      </Suspense>
    </div>
  );
}

