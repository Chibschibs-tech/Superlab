"use client";

import { useState } from "react";
import {
  DollarSign,
  Zap,
  Calendar,
  HeartPulse,
  Plus,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createProjectUpdate } from "@/lib/actions/roadmap";
import type { Project, ProjectKPIs, ProjectMemberWithUser, UpdateType } from "@/types";

interface ProjectHeaderProps {
  project: Project;
  kpis: ProjectKPIs;
  team: ProjectMemberWithUser[];
  canEdit?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  Idea: { label: "IDÉE", color: "text-purple-400", bg: "bg-purple-500/20 border-purple-500/30" },
  Validation: { label: "VALIDATION", color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/30" },
  Scaling: { label: "INCUBATION ACTIVE", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30" },
  Stalled: { label: "EN PAUSE", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/30" },
  Supported: { label: "SOUTENU", color: "text-cyan-400", bg: "bg-cyan-500/20 border-cyan-500/30" },
};

const healthConfig: Record<string, { color: string; bg: string }> = {
  excellent: { color: "text-emerald-400", bg: "bg-emerald-500/20" },
  good: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  warning: { color: "text-amber-400", bg: "bg-amber-500/20" },
  critical: { color: "text-rose-400", bg: "bg-rose-500/20" },
};

export function ProjectHeader({ project, kpis, team, canEdit = false }: ProjectHeaderProps) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateContent, setUpdateContent] = useState("");
  const [updateType, setUpdateType] = useState<UpdateType>("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusCfg = statusConfig[project.status] || statusConfig.Idea;
  const healthCfg = healthConfig[kpis.healthScore.level];

  const handleSubmitUpdate = async () => {
    if (!updateContent.trim()) {
      toast.error("Le contenu est requis");
      return;
    }

    setIsSubmitting(true);
    const result = await createProjectUpdate({
      project_id: project.id,
      content: updateContent.trim(),
      type: updateType,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Mise à jour publiée !");
      setUpdateContent("");
      setIsUpdateModalOpen(false);
    } else {
      toast.error(result.error || "Erreur lors de la publication");
    }
  };

  const formatBudget = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Title Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Project: {project.title}
            </h1>
            <Badge className={cn("border font-medium uppercase tracking-wide", statusCfg.bg, statusCfg.color)}>
              {statusCfg.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Avatars */}
            <TooltipProvider>
              <div className="flex -space-x-2">
                {team.slice(0, 5).map((member) => (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-8 w-8 border-2 border-neutral-900 ring-2 ring-transparent hover:ring-violet-500/50 transition-all cursor-pointer">
                        <AvatarImage src={member.user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-violet-600 text-xs text-white">
                          {member.user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ||
                            member.user?.email?.[0]?.toUpperCase() ||
                            "?"}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{member.user?.full_name || member.user?.email}</p>
                      <p className="text-xs text-neutral-400 capitalize">{member.role}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {team.length > 5 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-900 bg-neutral-800 text-xs font-medium text-neutral-300">
                    +{team.length - 5}
                  </div>
                )}
                {team.length === 0 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-neutral-600 text-neutral-500">
                    <Users className="h-4 w-4" />
                  </div>
                )}
              </div>
            </TooltipProvider>

            {/* Submit Update Button */}
            {canEdit && (
              <Button
                onClick={() => setIsUpdateModalOpen(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Submit Update
              </Button>
            )}
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Budget Used */}
          <KPICard
            icon={DollarSign}
            label="Budget utilisé"
            value={
              kpis.budgetTotal
                ? `${formatBudget(kpis.budgetUsed)} / ${formatBudget(kpis.budgetTotal)}€`
                : `${formatBudget(kpis.budgetUsed)}€`
            }
            subValue={kpis.budgetPercent !== null ? `${kpis.budgetPercent}% du total` : undefined}
            color="violet"
            progress={kpis.budgetPercent}
          />

          {/* Sprint Velocity */}
          <KPICard
            icon={Zap}
            label="Sprint Velocity"
            value={`${kpis.sprintVelocity} tâches`}
            subValue="14 derniers jours"
            color="cyan"
          />

          {/* Days to Launch */}
          <KPICard
            icon={Calendar}
            label="Jours avant lancement"
            value={kpis.daysToLaunch !== null ? `${kpis.daysToLaunch}` : "Non défini"}
            subValue={
              kpis.daysToLaunch !== null
                ? kpis.daysToLaunch < 0
                  ? "En retard"
                  : kpis.daysToLaunch === 0
                  ? "Aujourd'hui !"
                  : project.launch_date
                  ? new Date(project.launch_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                  : undefined
                : undefined
            }
            color={kpis.daysToLaunch !== null && kpis.daysToLaunch < 0 ? "rose" : "emerald"}
          />

          {/* Health Score */}
          <KPICard
            icon={HeartPulse}
            label="Santé du projet"
            value={`${kpis.healthScore.score}%`}
            subValue={kpis.healthScore.label}
            color={kpis.healthScore.level === "excellent" || kpis.healthScore.level === "good" ? "emerald" : kpis.healthScore.level === "warning" ? "amber" : "rose"}
            healthLevel={kpis.healthScore.level}
          />
        </div>
      </div>

      {/* Submit Update Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="max-w-lg bg-neutral-900 border-white/10">
          <DialogHeader>
            <DialogTitle>Publier une mise à jour</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de mise à jour</Label>
              <Select value={updateType} onValueChange={(v) => setUpdateType(v as UpdateType)}>
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">Général</SelectItem>
                  <SelectItem value="Milestone">Jalon atteint</SelectItem>
                  <SelectItem value="Blocker">Bloqueur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contenu</Label>
              <Textarea
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                placeholder="Décrivez les progrès, les défis rencontrés ou les prochaines étapes..."
                className="min-h-[150px] bg-white/[0.02] border-white/10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)} className="border-white/10">
              Annuler
            </Button>
            <Button
              onClick={handleSubmitUpdate}
              disabled={isSubmitting || !updateContent.trim()}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// KPI Card Component
interface KPICardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  color: "violet" | "cyan" | "emerald" | "amber" | "rose";
  progress?: number | null;
  healthLevel?: string;
}

const colorMap = {
  violet: { icon: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", progress: "bg-violet-500" },
  cyan: { icon: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", progress: "bg-cyan-500" },
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", progress: "bg-emerald-500" },
  amber: { icon: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", progress: "bg-amber-500" },
  rose: { icon: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", progress: "bg-rose-500" },
};

function KPICard({ icon: Icon, label, value, subValue, color, progress, healthLevel }: KPICardProps) {
  const colors = colorMap[color];

  return (
    <Card className={cn("relative overflow-hidden border p-4", colors.bg, colors.border)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subValue && <p className="text-xs text-neutral-400">{subValue}</p>}
        </div>
        <div className={cn("rounded-lg p-2", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
      </div>

      {/* Progress bar for budget */}
      {progress !== null && progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-white/5">
            <div
              className={cn("h-full rounded-full transition-all", colors.progress)}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Health level indicator */}
      {healthLevel && (
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <div
            className={cn(
              "h-full w-full",
              healthLevel === "excellent" && "bg-emerald-500",
              healthLevel === "good" && "bg-cyan-500",
              healthLevel === "warning" && "bg-amber-500",
              healthLevel === "critical" && "bg-rose-500"
            )}
          />
        </div>
      )}
    </Card>
  );
}

