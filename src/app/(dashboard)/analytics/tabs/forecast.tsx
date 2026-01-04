"use client";

import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  AlertCircle,
  Target,
  Lightbulb,
  CheckCircle2,
  Pause,
  ExternalLink,
  Wallet,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ForecastMetrics } from "@/lib/data/analytics";
import type { ProjectStatus } from "@/types";

interface ForecastTabProps {
  data: ForecastMetrics;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; icon: typeof TrendingUp }
> = {
  Idea: {
    label: "Idée",
    color: "text-violet-400",
    bg: "bg-violet-500/20",
    icon: Lightbulb,
  },
  Validation: {
    label: "Validation",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    icon: Target,
  },
  Scaling: {
    label: "Scaling",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    icon: TrendingUp,
  },
  Stalled: {
    label: "En pause",
    color: "text-rose-400",
    bg: "bg-rose-500/20",
    icon: Pause,
  },
  Supported: {
    label: "Soutenu",
    color: "text-green-400",
    bg: "bg-green-500/20",
    icon: CheckCircle2,
  },
};

export function ForecastTab({ data }: ForecastTabProps) {
  const totalResourceRequests =
    data.resourceRequests.budget +
    data.resourceRequests.headcount +
    data.resourceRequests.other;

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Ask Value */}
        <Card className="border-white/10 bg-gradient-to-br from-emerald-950/30 via-neutral-900 to-neutral-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Budget demandé total</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">
                  {data.totalAskValue}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              Somme des demandes en attente
            </p>
          </CardContent>
        </Card>

        {/* Pending Asks */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Demandes en attente</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.pendingAsks.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                <DollarSign className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              Projets avec &quot;The Ask&quot; non approuvé
            </p>
          </CardContent>
        </Card>

        {/* Projects Needing Attention */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Requièrent attention</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.projectsNeedingAttention}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20">
                <AlertCircle className="h-6 w-6 text-rose-400" />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              Projets en pause + demandes en attente
            </p>
          </CardContent>
        </Card>

        {/* Projected Completions */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Complétions prévues</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.projectedCompletions}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <Calendar className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              Jalons en cours pour les 30 prochains jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Requests Summary */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-violet-400" />
            Demandes de Ressources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Budget Requests */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {data.resourceRequests.budget}
                </p>
                <p className="text-sm text-neutral-500">Budgets</p>
              </div>
            </div>

            {/* Headcount Requests */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {data.resourceRequests.headcount}
                </p>
                <p className="text-sm text-neutral-500">Effectifs</p>
              </div>
            </div>

            {/* Other Requests */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                <Package className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {data.resourceRequests.other}
                </p>
                <p className="text-sm text-neutral-500">Autres</p>
              </div>
            </div>
          </div>
          {totalResourceRequests === 0 && (
            <div className="text-center py-4 mt-4">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm text-neutral-400">
                Aucune demande de ressources en attente
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Asks List */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-amber-400" />
              Demandes en Attente (The Ask)
            </div>
            {data.pendingAsks.length > 0 && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                {data.pendingAsks.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.pendingAsks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
              <p className="text-sm text-neutral-400">
                Toutes les demandes ont été traitées
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {data.pendingAsks.map((ask) => {
                const config = statusConfig[ask.status];
                const StatusIcon = config.icon;

                return (
                  <Link
                    key={ask.id}
                    href={`/showroom/${ask.projectSlug}`}
                    className="block p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon className={cn("h-4 w-4", config.color)} />
                          <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors truncate">
                            {ask.projectTitle}
                          </p>
                        </div>
                        <p className="text-sm text-neutral-400 line-clamp-2">
                          {ask.theAsk}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px]", config.bg, config.color)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-neutral-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


