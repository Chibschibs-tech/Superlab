"use client";

import Link from "next/link";
import {
  Heart,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Target,
  Pause,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PortfolioHealthMetrics, StageDistribution, ProjectStatus } from "@/lib/data/analytics";

interface PortfolioHealthTabProps {
  data: PortfolioHealthMetrics;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; icon: typeof TrendingUp }
> = {
  Idea: {
    label: "Idée",
    color: "text-violet-400",
    bg: "bg-violet-500",
    icon: Lightbulb,
  },
  Validation: {
    label: "Validation",
    color: "text-blue-400",
    bg: "bg-blue-500",
    icon: Target,
  },
  Scaling: {
    label: "Scaling",
    color: "text-emerald-400",
    bg: "bg-emerald-500",
    icon: TrendingUp,
  },
  Stalled: {
    label: "En pause",
    color: "text-rose-400",
    bg: "bg-rose-500",
    icon: Pause,
  },
  Supported: {
    label: "Soutenu",
    color: "text-green-400",
    bg: "bg-green-500",
    icon: CheckCircle2,
  },
};

export function PortfolioHealthTab({ data }: PortfolioHealthTabProps) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Bon";
    if (score >= 40) return "Attention requise";
    return "Critique";
  };

  return (
    <div className="space-y-6">
      {/* Top Row: Health Score + Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Health Score Card */}
        <Card className="border-white/10 bg-gradient-to-br from-rose-950/30 via-neutral-900 to-neutral-950">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-rose-400" />
              Score de Santé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className={cn("text-6xl font-bold", getHealthColor(data.healthScore))}>
                {data.healthScore}
              </div>
              <div className="pb-2">
                <div className={cn("text-lg font-medium", getHealthColor(data.healthScore))}>
                  {getHealthLabel(data.healthScore)}
                </div>
                <div className="text-sm text-neutral-500">
                  {data.totalProjects} projets au total
                </div>
              </div>
            </div>
            <Progress
              value={data.healthScore}
              className="h-2 mt-4"
            />
            <p className="text-xs text-neutral-500 mt-3">
              Basé sur les projets en retard, bloqués, et en scaling
            </p>
          </CardContent>
        </Card>

        {/* Stage Distribution Card */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-violet-400" />
              Répartition par Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.stageDistribution.map((stage) => {
                const config = statusConfig[stage.status];
                const Icon = config.icon;
                return (
                  <div key={stage.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <span className="text-neutral-300">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{stage.count}</span>
                        <span className="text-neutral-500">({stage.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", config.bg)}
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Stale + Blocked Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stale Projects */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-amber-400" />
                Projets en Retard
              </div>
              {data.staleProjects.length > 0 && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                  {data.staleProjects.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.staleProjects.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm text-neutral-400">
                  Tous les projets sont à jour !
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {data.staleProjects.map((project) => {
                  const config = statusConfig[project.status];
                  return (
                    <Link
                      key={project.id}
                      href={`/showroom/${project.slug}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-amber-400 transition-colors">
                          {project.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px]", config.bg + "/20", config.color)}
                          >
                            {config.label}
                          </Badge>
                          <span className="text-xs text-neutral-500">
                            {project.daysSinceUpdate}j sans mise à jour
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-neutral-500 group-hover:text-amber-400 transition-colors flex-shrink-0 ml-2" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blocked Items */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <XCircle className="h-5 w-5 text-rose-400" />
                Éléments Bloqués
              </div>
              {data.blockedItems.length > 0 && (
                <Badge variant="secondary" className="bg-rose-500/20 text-rose-400">
                  {data.blockedItems.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.blockedItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm text-neutral-400">
                  Aucun élément bloqué
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {data.blockedItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/showroom/${item.projectSlug}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-rose-500/30 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-rose-400 transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            item.type === "task"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-violet-500/20 text-violet-400"
                          )}
                        >
                          {item.type === "task" ? "Tâche" : "Jalon"}
                        </Badge>
                        <span className="text-xs text-neutral-500 truncate">
                          {item.projectTitle}
                        </span>
                        <span className="text-xs text-rose-400">
                          {item.daysSinceBlocked}j
                        </span>
                      </div>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


