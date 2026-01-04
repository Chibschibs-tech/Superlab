import { Suspense } from "react";
import { BarChart3 } from "lucide-react";
import { getAllAnalytics } from "@/lib/data/analytics";
import { AnalyticsTabs } from "./analytics-tabs";
import { AnalyticsLoading } from "./loading";

export const metadata = {
  title: "Analytics | Supermedia Lab",
  description: "Portfolio health, momentum, and forecast metrics",
};

export default async function AnalyticsPage() {
  const analytics = await getAllAnalytics();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-neutral-400">
            Vue d&apos;ensemble du portfolio et métriques de performance
          </p>
        </div>
      </div>

      {/* Analytics Content */}
      <Suspense fallback={<AnalyticsLoading />}>
        <AnalyticsTabs
          portfolioHealth={analytics.portfolioHealth}
          momentum={analytics.momentum}
          forecast={analytics.forecast}
        />
      </Suspense>
    </div>
  );
}


