"use client";

import Link from "next/link";
import {
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  MessageSquareWarning,
  Timer,
  ListChecks,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { MomentumMetrics, MilestoneStatus } from "@/lib/data/analytics";

interface MomentumTabProps {
  data: MomentumMetrics;
}

const milestoneStatusConfig: Record<MilestoneStatus, { label: string; color: string; bg: string }> = {
  planned: { label: "Planifié", color: "text-neutral-400", bg: "bg-neutral-500/20" },
  in_progress: { label: "En cours", color: "text-cyan-400", bg: "bg-cyan-500/20" },
  completed: { label: "Terminé", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  delayed: { label: "En retard", color: "text-amber-400", bg: "bg-amber-500/20" },
  cancelled: { label: "Annulé", color: "text-rose-400", bg: "bg-rose-500/20" },
};

export function MomentumTab({ data }: MomentumTabProps) {
  const getTrendIcon = () => {
    switch (data.velocityTrend) {
      case "up":
        return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case "down":
        return <TrendingDown className="h-5 w-5 text-rose-400" />;
      default:
        return <Minus className="h-5 w-5 text-neutral-400" />;
    }
  };

  const getTrendLabel = () => {
    switch (data.velocityTrend) {
      case "up":
        return "En hausse";
      case "down":
        return "En baisse";
      default:
        return "Stable";
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tasks Completed */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Tâches cette semaine</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.tasksCompletedThisWeek}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <ListChecks className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-sm">
              {getTrendIcon()}
              <span className={cn(
                data.velocityTrend === "up" && "text-emerald-400",
                data.velocityTrend === "down" && "text-rose-400",
                data.velocityTrend === "stable" && "text-neutral-400"
              )}>
                {getTrendLabel()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Milestone Completion Rate */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Taux de complétion</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.milestoneCompletionRate}%
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <Target className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-neutral-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              {data.milestonesCompletedThisMonth}/{data.milestoneTotalThisMonth} jalons ce mois
            </div>
          </CardContent>
        </Card>

        {/* Avg Decision Time */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Délai décision moyen</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.avgDecisionTimeInDays}j
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                <Timer className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-neutral-500">
              {data.avgDecisionTimeInDays <= 3 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Excellent</span>
                </>
              ) : data.avgDecisionTimeInDays <= 7 ? (
                <>
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-400">Correct</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  <span className="text-rose-400">À améliorer</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Decisions */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Décisions en attente</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {data.pendingDecisions.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
                <MessageSquareWarning className="h-6 w-6 text-violet-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-neutral-500">
              {data.pendingDecisions.length === 0 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">À jour</span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-400">Requièrent attention</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Milestones */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-cyan-400" />
                Jalons à venir (30j)
              </div>
              {data.upcomingMilestones.length > 0 && (
                <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                  {data.upcomingMilestones.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingMilestones.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-10 w-10 text-neutral-600 mb-2" />
                <p className="text-sm text-neutral-400">
                  Aucun jalon prévu pour les 30 prochains jours
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {data.upcomingMilestones.map((milestone) => {
                  const config = milestoneStatusConfig[milestone.status];
                  const isUrgent = milestone.daysUntilDue <= 7;
                  
                  return (
                    <Link
                      key={milestone.id}
                      href={`/showroom/${milestone.projectSlug}`}
                      className={cn(
                        "block p-3 rounded-lg border transition-colors group",
                        isUrgent
                          ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                          : "bg-white/[0.02] border-white/5 hover:border-cyan-500/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                            {milestone.title}
                          </p>
                          <p className="text-xs text-neutral-500 truncate mt-0.5">
                            {milestone.projectTitle}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px]",
                              isUrgent
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-white/5 text-neutral-400"
                            )}
                          >
                            {milestone.daysUntilDue === 0
                              ? "Aujourd'hui"
                              : milestone.daysUntilDue === 1
                              ? "Demain"
                              : `${milestone.daysUntilDue}j`}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={cn(config.color)}>{config.label}</span>
                          <span className="text-neutral-400">{milestone.progressPercent}%</span>
                        </div>
                        <Progress value={milestone.progressPercent} className="h-1.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Decisions List */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <MessageSquareWarning className="h-5 w-5 text-violet-400" />
                Décisions en Attente
              </div>
              {data.pendingDecisions.length > 0 && (
                <Badge variant="secondary" className="bg-violet-500/20 text-violet-400">
                  {data.pendingDecisions.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.pendingDecisions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm text-neutral-400">
                  Toutes les décisions ont été prises
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                {data.pendingDecisions.map((decision) => {
                  const isUrgent = decision.daysPending > 7;
                  
                  return (
                    <Link
                      key={decision.id}
                      href={`/decisions`}
                      className={cn(
                        "block p-3 rounded-lg border transition-colors group",
                        isUrgent
                          ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
                          : "bg-white/[0.02] border-white/5 hover:border-violet-500/30"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors line-clamp-2">
                            {decision.question}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-neutral-500 truncate">
                              {decision.projectTitle}
                            </span>
                            <span className="text-xs text-neutral-600">•</span>
                            <span
                              className={cn(
                                "text-xs",
                                isUrgent ? "text-rose-400" : "text-neutral-500"
                              )}
                            >
                              {decision.daysPending}j d&apos;attente
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-neutral-500 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


