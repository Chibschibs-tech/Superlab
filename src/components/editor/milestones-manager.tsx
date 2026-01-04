"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Milestone as MilestoneIcon,
  Calendar,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
  type MilestoneFormData,
} from "@/lib/actions/milestones";
import type { Milestone, MilestoneStatus, Task } from "@/types";

interface MilestonesManagerProps {
  projectId: string;
  milestones: Milestone[];
  tasks: Task[];
  onMilestonesChange?: () => void;
}

const statusConfig: Record<MilestoneStatus, { icon: typeof CheckCircle2; label: string; color: string; bg: string }> = {
  planned: { icon: Target, label: "Planifié", color: "text-neutral-400", bg: "bg-neutral-500/20" },
  in_progress: { icon: Clock, label: "En cours", color: "text-cyan-400", bg: "bg-cyan-500/20" },
  completed: { icon: CheckCircle2, label: "Terminé", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  delayed: { icon: AlertTriangle, label: "En retard", color: "text-amber-400", bg: "bg-amber-500/20" },
  cancelled: { icon: XCircle, label: "Annulé", color: "text-rose-400", bg: "bg-rose-500/20" },
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "Non défini";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface MilestoneDialogProps {
  projectId: string;
  milestone?: Milestone;
  onSuccess: () => void;
  children: React.ReactNode;
}

function MilestoneDialog({ projectId, milestone, onSuccess, children }: MilestoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<MilestoneFormData>({
    title: milestone?.title || "",
    description: milestone?.description || "",
    status: milestone?.status || "planned",
    start_date: milestone?.start_date || "",
    target_date: milestone?.target_date || "",
    progress_percent: milestone?.progress_percent || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.target_date) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    startTransition(async () => {
      const result = milestone
        ? await updateMilestone(milestone.id, formData)
        : await createMilestone(projectId, formData);

      if (result.success) {
        toast.success(milestone ? "Jalon mis à jour" : "Jalon créé");
        setOpen(false);
        if (!milestone) {
          setFormData({
            title: "",
            description: "",
            status: "planned",
            start_date: "",
            target_date: "",
            progress_percent: 0,
          });
        }
        onSuccess();
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-neutral-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {milestone ? "Modifier le jalon" : "Nouveau jalon"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Phase 1: MVP"
              className="border-white/10 bg-white/5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Objectifs et livrables..."
              className="border-white/10 bg-white/5 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_date">Date cible *</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="border-white/10 bg-white/5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as MilestoneStatus })}
              >
                <SelectTrigger className="border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn("h-4 w-4", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress">Progression ({formData.progress_percent}%)</Label>
              <Input
                id="progress"
                type="range"
                min={0}
                max={100}
                step={5}
                value={formData.progress_percent}
                onChange={(e) => setFormData({ ...formData, progress_percent: parseInt(e.target.value) })}
                className="border-white/10 bg-white/5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-white/10">
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="bg-cyan-600 hover:bg-cyan-500">
              {isPending ? "Enregistrement..." : milestone ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface MilestoneCardProps {
  milestone: Milestone;
  tasks: Task[];
  onUpdate: () => void;
}

function MilestoneCard({ milestone, tasks, onUpdate }: MilestoneCardProps) {
  const [isOpen, setIsOpen] = useState(milestone.status === "in_progress");
  const [isPending, startTransition] = useTransition();

  const config = statusConfig[milestone.status];
  const Icon = config.icon;
  const milestoneTasks = tasks.filter((t) => t.milestone_id === milestone.id);
  const completedTasks = milestoneTasks.filter((t) => t.status === "done").length;

  const handleDelete = () => {
    if (!confirm("Supprimer ce jalon ? Les tâches associées seront détachées.")) return;

    startTransition(async () => {
      const result = await deleteMilestone(milestone.id);
      if (result.success) {
        toast.success("Jalon supprimé");
        onUpdate();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "rounded-xl border bg-white/[0.02] overflow-hidden transition-all",
          milestone.status === "in_progress"
            ? "border-cyan-500/30"
            : milestone.status === "completed"
            ? "border-emerald-500/30"
            : "border-white/10"
        )}
      >
        {/* Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", config.bg)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white truncate">{milestone.title}</h4>
                <Badge variant="secondary" className={cn("text-xs", config.bg, config.color)}>
                  {config.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(milestone.target_date)}
                </span>
                {milestoneTasks.length > 0 && (
                  <span>
                    {completedTasks}/{milestoneTasks.length} tâches
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-24 hidden sm:block">
                <Progress value={milestone.progress_percent} className="h-2" />
              </div>
              <span className="text-sm font-medium text-neutral-400 w-10 text-right">
                {milestone.progress_percent}%
              </span>
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-neutral-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-neutral-500" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="border-t border-white/10 p-4 space-y-4">
            {milestone.description && (
              <p className="text-sm text-neutral-400">{milestone.description}</p>
            )}

            {/* Tasks Preview */}
            {milestoneTasks.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Tâches associées
                </h5>
                <div className="space-y-1">
                  {milestoneTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm text-neutral-300"
                    >
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          task.status === "done" ? "bg-emerald-400" : "bg-neutral-600"
                        )}
                      />
                      <span className={task.status === "done" ? "line-through opacity-60" : ""}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {milestoneTasks.length > 5 && (
                    <p className="text-xs text-neutral-500">
                      +{milestoneTasks.length - 5} autres tâches
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <MilestoneDialog projectId={milestone.project_id} milestone={milestone} onSuccess={onUpdate}>
                <Button variant="outline" size="sm" className="border-white/10">
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </MilestoneDialog>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function MilestonesManager({
  projectId,
  milestones,
  tasks,
  onMilestonesChange,
}: MilestonesManagerProps) {
  const handleUpdate = () => {
    onMilestonesChange?.();
  };

  // Group milestones by status
  const inProgress = milestones.filter((m) => m.status === "in_progress");
  const planned = milestones.filter((m) => m.status === "planned");
  const completed = milestones.filter((m) => m.status === "completed");
  const other = milestones.filter((m) => m.status === "delayed" || m.status === "cancelled");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <MilestoneIcon className="h-5 w-5 text-violet-400" />
          Roadmap
          <Badge variant="secondary" className="ml-2 bg-white/10">
            {milestones.length}
          </Badge>
        </h3>

        <MilestoneDialog projectId={projectId} onSuccess={handleUpdate}>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-500">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau jalon
          </Button>
        </MilestoneDialog>
      </div>

      {/* Milestones List */}
      <div className="space-y-3">
        {/* In Progress */}
        {inProgress.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            tasks={tasks}
            onUpdate={handleUpdate}
          />
        ))}

        {/* Planned */}
        {planned.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            tasks={tasks}
            onUpdate={handleUpdate}
          />
        ))}

        {/* Completed */}
        {completed.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            tasks={tasks}
            onUpdate={handleUpdate}
          />
        ))}

        {/* Delayed/Cancelled */}
        {other.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            tasks={tasks}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {/* Empty State */}
      {milestones.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-4">
            <MilestoneIcon className="h-8 w-8 text-neutral-500" />
          </div>
          <h4 className="font-medium text-neutral-300">Aucun jalon</h4>
          <p className="text-sm text-neutral-500 mt-1 max-w-xs">
            Créez des jalons pour structurer votre roadmap et suivre l&apos;avancement du projet.
          </p>
          <MilestoneDialog projectId={projectId} onSuccess={handleUpdate}>
            <Button variant="outline" className="mt-4 border-white/10">
              <Plus className="h-4 w-4 mr-2" />
              Créer un jalon
            </Button>
          </MilestoneDialog>
        </div>
      )}
    </div>
  );
}

