import { Suspense } from "react";
import { CircleCheckBig } from "lucide-react";
import { getDecisions } from "@/lib/data/decisions";
import { DecisionsContent } from "./decisions-content";

export const metadata = {
  title: "Décisions | Supermedia Lab",
  description: "Demandes d'approbation et ressources",
};

function DecisionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-800/50" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-800/50" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl bg-neutral-800/50"
        />
      ))}
    </div>
  );
}

async function DecisionsData() {
  const decisions = await getDecisions();
  return <DecisionsContent decisions={decisions} />;
}

export default function DecisionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-white/10">
          <CircleCheckBig className="h-6 w-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Décisions
          </h1>
          <p className="text-sm text-neutral-400">
            Demandes d&apos;approbation en attente
          </p>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={<DecisionsSkeleton />}>
        <DecisionsData />
      </Suspense>
    </div>
  );
}
