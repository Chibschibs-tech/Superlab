import { Suspense } from "react";
import { DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueDashboard } from "./revenue-dashboard";
import {
  getRevenueMetrics,
  getStreamMetrics,
  getRiskMetrics,
  getForecastMetrics,
  getRevenueStreams,
} from "@/lib/data/revenue";
import { getSourceFreshness } from "@/lib/actions/revenue";

export const metadata = {
  title: "Revenue Cockpit | Supermedia Lab",
  description: "Tableau de bord des revenus",
};

async function RevenueData() {
  const [metrics, streamMetrics, riskMetrics, forecastMetrics, streams, sourceFreshness] = await Promise.all([
    getRevenueMetrics(),
    getStreamMetrics(),
    getRiskMetrics(),
    getForecastMetrics(),
    getRevenueStreams(),
    getSourceFreshness(),
  ]);

  return (
    <RevenueDashboard
      metrics={metrics}
      streamMetrics={streamMetrics}
      riskMetrics={riskMetrics}
      forecastMetrics={forecastMetrics}
      streams={streams}
      sourceFreshness={sourceFreshness}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-xl bg-white/5" />
    </div>
  );
}

export default function RevenuePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 via-teal-600/10 to-cyan-600/20 p-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <DollarSign className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Revenue Cockpit
            </h1>
            <p className="mt-1 text-neutral-400">
              Vue d&apos;ensemble des flux de revenus Supermedia
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <Suspense fallback={<LoadingSkeleton />}>
        <RevenueData />
      </Suspense>
    </div>
  );
}

