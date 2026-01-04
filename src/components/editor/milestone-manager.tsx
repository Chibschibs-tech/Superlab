"use client";

import { useState, useTransition } from "react";
import {
  Milestone as MilestoneIcon,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Target,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createMilestone, updateMilestone, deleteMilestone } from "@/lib/actions/editor";
import type { Milestone, MilestoneStatus, Task } from "@/types";

interface MilestoneManagerProps {
  projectId: string;
  milestones: Milestone[];
  tasks: Task[];
}

const statusConfig: Record<MilestoneStatus, { label: string; icon: typeof Target; color: string; bg: string }> = {
  planned: { label: "Planifié", icon: Target, color: "text-neutral-400", bg: "bg-neutral-500/20" },
  in_progress: { label: "En cours", icon: Clock, color: "text-cyan-400", bg: "bg-cyan-500/20" },
  completed: { label: "Terminé", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  delayed: { label: "En retard", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/20" },
  cancelled: { label: "Annulé", icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/20" },
};

interface MilestoneFormData {
  title: string;
  description: string;
  status: MilestoneStatus;
  target_date: string;
  start_date: string;
  progress_percent: number;
}

const defaultFormData: MilestoneFormData = {
  title: "",
  description: "",
  status: "planned",
  target_date: new Date().toISOString().split("T")[0],
  start_date: "",
  progress_percent: 0,
};

export function MilestoneManager({ projectId, milestones, tasks }: MilestoneManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState<MilestoneFormData>(defaultFormData);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const getTasksForMilestone = (milestoneId: string) => 
    tasks.filter((t) => t.milestone_id === milestoneId);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMilestones(newExpanded);
  };

  const openCreateDialog = () => {
    setEditingMilestone(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description ?? "",
      status: milestone.status,
      target_date: milestone.target_date,
      start_date: milestone.start_date ?? "",
      progress_percent: milestone.progress_percent,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.target_date) {
      toast.error("Titre et date cible sont requis");
      return;
    }

    startTransition(async () => {
      if (editingMilestone) {
        const result = await updateMilestone(editingMilestone.id, {
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          target_date: formData.target_date,
          start_date: formData.start_date || null,
          progress_percent: formData.progress_percent,
          completed_date: formData.status === "completed" ? new Date().toISOString().split("T")[0] : null,
        });

        if (result.success) {
          toast.success("Jalon mis à jour");
          setIsDialogOpen(false);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createMilestone({
          project_id: projectId,
          title: formData.title,
          description: formData.description || undefined,
          target_date: formData.target_date,
          start_date: formData.start_date || undefined,
          status: formData.status,
        });

        if (result.success) {
          toast.success("Jalon créé");
          setIsDialogOpen(false);
        } else {
          toast.error(result.error);
        }
      }
    });
  };

  const handleDelete = (milestoneId: string) => {
    if (!confirm("Supprimer ce jalon ?")) return;
    
    startTransition(async () => {
      const result = await deleteMilestone(milestoneId);
      if (result.success) {
        toast.success("Jalon supprimé");
      } else {
        toast.error(result.error);
      }
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MilestoneIcon className="h-5 w-5 text-emerald-400" />
              Jalons
            </CardTitle>
            <Button
              size="sm"
              onClick={openCreateDialog}
              className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <MilestoneIcon className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-400">Aucun jalon</p>
              <p className="text-xs text-neutral-500 mt-1">
                Définissez les étapes clés de votre projet
              </p>
            </div>
          ) : (
            milestones.map((milestone) => {
              const config = statusConfig[milestone.status];
              const Icon = config.icon;
              const milestoneTasks = getTasksForMilestone(milestone.id);
              const isExpanded = expandedMilestones.has(milestone.id);

              return (
                <Collapsible
                  key={milestone.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(milestone.id)}
                >
                  <div
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      "border-white/5 bg-white/[0.02] hover:border-white/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("rounded-lg p-2", config.bg, config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-white">{milestone.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(milestone.target_date)}
                              <span className={cn("px-1.5 py-0.5 rounded", config.bg, config.color)}>
                                {config.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(milestone)}
                              className="h-7 w-7 text-neutral-400 hover:text-white"
                              aria-label="Modifier"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(milestone.id)}
                              disabled={isPending}
                              className="h-7 w-7 text-neutral-400 hover:text-rose-400"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-neutral-500">Progression</span>
                            <span className="text-white">{milestone.progress_percent}%</span>
                          </div>
                          <Progress value={milestone.progress_percent} className="h-1.5" />
                        </div>

                        {/* Tasks preview */}
                        {milestoneTasks.length > 0 && (
                          <CollapsibleTrigger className="flex items-center gap-1.5 mt-3 text-xs text-neutral-400 hover:text-white transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            {milestoneTasks.length} tâche{milestoneTasks.length > 1 ? "s" : ""}
                          </CollapsibleTrigger>
                        )}
                      </div>
                    </div>

                    <CollapsibleContent>
                      {milestoneTasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                          {milestoneTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 text-sm py-1.5 px-2 rounded bg-white/[0.02]"
                            >
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  task.status === "done" && "bg-emerald-400",
                                  task.status === "in_progress" && "bg-cyan-400",
                                  task.status === "blocked" && "bg-rose-400",
                                  !["done", "in_progress", "blocked"].includes(task.status) && "bg-neutral-500"
                                )}
                              />
                              <span className={cn(
                                "flex-1 truncate",
                                task.status === "done" ? "text-neutral-500 line-through" : "text-neutral-300"
                              )}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-neutral-900 border-white/10">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? "Modifier le jalon" : "Nouveau jalon"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Phase 1: MVP"
                className="bg-white/[0.02] border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du jalon..."
                className="bg-white/[0.02] border-white/10 min-h-[80px]"
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
                  className="bg-white/[0.02] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_date">Date cible *</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="bg-white/[0.02] border-white/10"
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
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <config.icon className={cn("h-4 w-4", config.color)} />
                          {config.label}
                        </span>
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
                  value={formData.progress_percent}
                  onChange={(e) => setFormData({ ...formData, progress_percent: parseInt(e.target.value) })}
                  className="accent-emerald-500"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/10">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingMilestone ? (
                "Mettre à jour"
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


