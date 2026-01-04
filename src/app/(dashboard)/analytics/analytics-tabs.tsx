"use client";

import { Heart, Zap, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  PortfolioHealthMetrics,
  MomentumMetrics,
  ForecastMetrics,
} from "@/lib/data/analytics";
import { PortfolioHealthTab } from "./tabs/portfolio-health";
import { MomentumTab } from "./tabs/momentum";
import { ForecastTab } from "./tabs/forecast";

interface AnalyticsTabsProps {
  portfolioHealth: PortfolioHealthMetrics;
  momentum: MomentumMetrics;
  forecast: ForecastMetrics;
}

export function AnalyticsTabs({
  portfolioHealth,
  momentum,
  forecast,
}: AnalyticsTabsProps) {
  return (
    <Tabs defaultValue="health" className="space-y-6">
      {/* Tab Navigation */}
      <TabsList className="w-full h-auto flex-wrap gap-1 bg-white/[0.02] border border-white/10 p-1 rounded-xl">
        <TabsTrigger
          value="health"
          className="flex-1 min-w-[120px] data-[state=active]:bg-rose-600 data-[state=active]:text-white"
        >
          <Heart className="h-4 w-4 mr-1.5 hidden sm:block" />
          Portfolio Health
        </TabsTrigger>
        <TabsTrigger
          value="momentum"
          className="flex-1 min-w-[120px] data-[state=active]:bg-amber-600 data-[state=active]:text-white"
        >
          <Zap className="h-4 w-4 mr-1.5 hidden sm:block" />
          Momentum
        </TabsTrigger>
        <TabsTrigger
          value="forecast"
          className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
        >
          <TrendingUp className="h-4 w-4 mr-1.5 hidden sm:block" />
          Forecast
        </TabsTrigger>
      </TabsList>

      {/* Portfolio Health Tab */}
      <TabsContent value="health" className="mt-0">
        <PortfolioHealthTab data={portfolioHealth} />
      </TabsContent>

      {/* Momentum Tab */}
      <TabsContent value="momentum" className="mt-0">
        <MomentumTab data={momentum} />
      </TabsContent>

      {/* Forecast Tab */}
      <TabsContent value="forecast" className="mt-0">
        <ForecastTab data={forecast} />
      </TabsContent>
    </Tabs>
  );
}


