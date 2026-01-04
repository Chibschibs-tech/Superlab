"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Target,
  Upload,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  RevenueMetrics,
  StreamMetrics,
  RiskMetrics,
  ForecastMetrics,
  RevenueStream,
} from "@/types";
import type { SourceFreshness } from "@/lib/actions/revenue";

interface RevenueDashboardProps {
  metrics: RevenueMetrics;
  streamMetrics: StreamMetrics[];
  riskMetrics: RiskMetrics;
  forecastMetrics: ForecastMetrics;
  streams: RevenueStream[];
  sourceFreshness: SourceFreshness[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({ metrics }: { metrics: RevenueMetrics }) {
  const cards = [
    {
      title: "Aujourd'hui",
      value: metrics.today,
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Semaine",
      value: metrics.wtd,
      subtitle: "WTD",
      icon: BarChart3,
      color: "from-violet-500 to-purple-500",
    },
    {
      title: "Mois",
      value: metrics.mtd,
      subtitle: "MTD",
      change: metrics.momChange,
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Année",
      value: metrics.ytd,
      subtitle: "YTD",
      icon: Target,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="group relative overflow-hidden border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04]"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 transition-opacity group-hover:opacity-5`}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-400">
                {card.title}
                {card.subtitle && (
                  <span className="ml-1 text-xs text-neutral-500">
                    ({card.subtitle})
                  </span>
                )}
              </CardTitle>
              <card.icon className="h-4 w-4 text-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(card.value)}
              </div>
              {card.change !== undefined && (
                <p
                  className={`mt-1 flex items-center text-xs ${
                    card.change >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {card.change >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  {formatPercent(card.change)} vs mois dernier
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Run Rate Projection */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Projection Fin de Mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-bold text-white">
              {formatCurrency(metrics.runRate)}
            </span>
            <span className="text-neutral-400">
              basé sur le rythme actuel
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Progression MTD</span>
              <span className="text-white">
                {formatCurrency(metrics.mtd)} / {formatCurrency(metrics.runRate)}
              </span>
            </div>
            <Progress
              value={(metrics.mtd / metrics.runRate) * 100}
              className="h-2 bg-white/5"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// STREAMS TAB
// ============================================

function StreamsTab({ streamMetrics }: { streamMetrics: StreamMetrics[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {streamMetrics.map((sm) => (
        <Card
          key={sm.stream.id}
          className="border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04]"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">
                {sm.stream.name}
              </CardTitle>
              <Badge
                variant="outline"
                className={`${
                  sm.percentAchieved >= 100
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : sm.percentAchieved >= 75
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-red-500/50 bg-red-500/10 text-red-400"
                }`}
              >
                {sm.percentAchieved.toFixed(0)}%
              </Badge>
            </div>
            {sm.stream.category && (
              <p className="text-sm text-neutral-500">{sm.stream.category}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-neutral-400">Réalisé MTD</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(sm.mtdActual)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400">Objectif</p>
                <p className="text-xl font-bold text-neutral-400">
                  {formatCurrency(sm.mtdTarget)}
                </p>
              </div>
            </div>
            <Progress
              value={Math.min(sm.percentAchieved, 100)}
              className="h-2 bg-white/5"
            />
            {/* Mini trend chart placeholder */}
            <div className="flex h-16 items-end gap-1">
              {sm.trend.slice(-14).map((point, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/50 to-emerald-400/80 transition-all hover:from-emerald-500/70 hover:to-emerald-400"
                  style={{
                    height: `${Math.max(
                      10,
                      (point.amount /
                        Math.max(...sm.trend.map((t) => t.amount))) *
                        100
                    )}%`,
                  }}
                  title={`${point.date}: ${formatCurrency(point.amount)}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// RISK TAB
// ============================================

function RiskTab({ riskMetrics }: { riskMetrics: RiskMetrics }) {
  const isHighRefundRate = riskMetrics.refundRate > 5;

  return (
    <div className="space-y-6">
      {/* Refund Rate */}
      <Card
        className={`border-white/5 ${
          isHighRefundRate ? "bg-red-500/5" : "bg-white/[0.02]"
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            {isHighRefundRate && (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            )}
            Taux de Remboursement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4">
            <span
              className={`text-4xl font-bold ${
                isHighRefundRate ? "text-red-400" : "text-white"
              }`}
            >
              {riskMetrics.refundRate.toFixed(1)}%
            </span>
            <span className="text-neutral-400">
              {riskMetrics.refundCount} remboursements / {riskMetrics.saleCount}{" "}
              ventes
            </span>
          </div>
          {isHighRefundRate && (
            <p className="mt-2 text-sm text-red-400">
              ⚠️ Le taux de remboursement dépasse 5%. Investigation recommandée.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Missing Data */}
      {riskMetrics.streamsWithMissingData.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Données Manquantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {riskMetrics.streamsWithMissingData.map((item) => (
                <li
                  key={item.stream.id}
                  className="flex items-center justify-between rounded-lg bg-black/20 p-3"
                >
                  <span className="text-white">{item.stream.name}</span>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                    {item.daysSinceLastEntry} jours sans données
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Status Distribution */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-white">Distribution des Statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-amber-500/10 p-4">
              <p className="text-sm text-amber-400">En attente</p>
              <p className="text-2xl font-bold text-white">
                {riskMetrics.pendingCount}
              </p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-4">
              <p className="text-sm text-red-400">Annulées</p>
              <p className="text-2xl font-bold text-white">
                {riskMetrics.cancelledCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// FORECAST TAB
// ============================================

function ForecastTab({ forecastMetrics }: { forecastMetrics: ForecastMetrics }) {
  const onTrack = forecastMetrics.gapToTarget <= 0;

  return (
    <div className="space-y-6">
      {/* Run Rate EOY */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-violet-400" />
            Projection Annuelle (Run Rate)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-white">
            {formatCurrency(forecastMetrics.runRateProjection)}
          </div>
          <p className="mt-2 text-neutral-400">
            Basé sur le rythme journalier moyen YTD
          </p>
        </CardContent>
      </Card>

      {/* MTD Target Gap */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-white">Objectif Fin de Mois</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-neutral-400">Reste à atteindre</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(forecastMetrics.mtdRemaining)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-400">Jours restants</p>
              <p className="text-2xl font-bold text-white">
                {forecastMetrics.daysRemainingInMonth}
              </p>
            </div>
          </div>
          {forecastMetrics.daysRemainingInMonth > 0 && (
            <p className="text-sm text-neutral-400">
              Soit{" "}
              <span className="font-medium text-white">
                {formatCurrency(
                  forecastMetrics.mtdRemaining /
                    forecastMetrics.daysRemainingInMonth
                )}
              </span>{" "}
              / jour nécessaire
            </p>
          )}
        </CardContent>
      </Card>

      {/* YTD vs Target */}
      <Card
        className={`border-white/5 ${
          onTrack ? "bg-emerald-500/5" : "bg-amber-500/5"
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            {onTrack ? (
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-amber-400" />
            )}
            YTD vs Objectif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-lg">
            <span className="text-neutral-400">Réalisé</span>
            <span className="font-bold text-white">
              {formatCurrency(forecastMetrics.ytdActual)}
            </span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-neutral-400">Objectif</span>
            <span className="font-bold text-neutral-400">
              {formatCurrency(forecastMetrics.ytdTarget)}
            </span>
          </div>
          <div className="border-t border-white/10 pt-4">
            <div className="flex justify-between text-lg">
              <span className="text-neutral-400">Écart</span>
              <span
                className={`font-bold ${
                  onTrack ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {forecastMetrics.gapToTarget <= 0 ? "+" : ""}
                {formatCurrency(Math.abs(forecastMetrics.gapToTarget))}
                {forecastMetrics.gapToTarget > 0 && " à rattraper"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// DATA FRESHNESS COMPONENT
// ============================================

function DataFreshnessBadge({ freshness }: { freshness: SourceFreshness[] }) {
  const hasWarning = freshness.some((s) => s.status === "warning" || s.status === "stale");
  const hasStale = freshness.some((s) => s.status === "stale");

  const overallStatus = hasStale ? "stale" : hasWarning ? "warning" : "fresh";
  
  const statusConfig = {
    fresh: {
      icon: CheckCircle2,
      label: "Données à jour",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    warning: {
      icon: Clock,
      label: "Données > 3 jours",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    stale: {
      icon: AlertCircle,
      label: "Données obsolètes",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
    },
  };

  const config = statusConfig[overallStatus];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`cursor-help ${config.bg} ${config.border} ${config.color}`}
          >
            <Icon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs bg-neutral-900 p-3">
          <p className="mb-2 text-xs font-semibold text-white">Fraîcheur des données</p>
          <div className="space-y-1.5">
            {freshness.map((source) => (
              <div key={source.source_id} className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">{source.source_name}</span>
                <span
                  className={
                    source.status === "fresh"
                      ? "text-emerald-400"
                      : source.status === "warning"
                      ? "text-amber-400"
                      : "text-red-400"
                  }
                >
                  {source.days_since_last_entry === 0
                    ? "Aujourd'hui"
                    : source.days_since_last_entry === 1
                    ? "Hier"
                    : source.days_since_last_entry !== null
                    ? `Il y a ${source.days_since_last_entry}j`
                    : "Jamais"}
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

export function RevenueDashboard({
  metrics,
  streamMetrics,
  riskMetrics,
  forecastMetrics,
  sourceFreshness,
}: RevenueDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">
                Vue d&apos;ensemble
              </TabsTrigger>
              <TabsTrigger value="streams" className="data-[state=active]:bg-white/10">
                Flux
              </TabsTrigger>
              <TabsTrigger value="risk" className="data-[state=active]:bg-white/10">
                Risques
              </TabsTrigger>
              <TabsTrigger value="forecast" className="data-[state=active]:bg-white/10">
                Prévisions
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Data Freshness Badge */}
          <DataFreshnessBadge freshness={sourceFreshness} />
        </div>

        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/revenue/import">
            <Upload className="mr-2 h-4 w-4" />
            Importer CSV
          </Link>
        </Button>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="overview" className="mt-0">
          <OverviewTab metrics={metrics} />
        </TabsContent>
        <TabsContent value="streams" className="mt-0">
          <StreamsTab streamMetrics={streamMetrics} />
        </TabsContent>
        <TabsContent value="risk" className="mt-0">
          <RiskTab riskMetrics={riskMetrics} />
        </TabsContent>
        <TabsContent value="forecast" className="mt-0">
          <ForecastTab forecastMetrics={forecastMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

