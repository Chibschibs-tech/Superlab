"use client";

import { useState, useTransition } from "react";
import {
  X,
  Calendar,
  User,
  Flag,
  Loader2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  updateMilestoneDates,
  updateMilestoneStatus,
  updateTaskDates,
  updateTaskStatus,
  updateTaskAssignee,
} from "@/lib/actions/roadmap";
import { updateMilestone, deleteMilestone, updateTask, deleteTask } from "@/lib/actions/editor";
import type { GanttMilestone, Task, MilestoneStatus, TaskStatus, TaskPriority, User as UserType, ProjectMemberWithUser } from "@/types";

interface RoadmapDrawerProps {
  type: "milestone" | "task";
  item: GanttMilestone | Task | null;
  parentMilestone?: GanttMilestone | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  teamMembers?: ProjectMemberWithUser[];
}

const milestoneStatusOptions: { value: MilestoneStatus; label: string; icon: typeof Target; color: string }[] = [
  { value: "planned", label: "Planifié", icon: Target, color: "text-neutral-400" },
  { value: "in_progress", label: "En cours", icon: Clock, color: "text-cyan-400" },
  { value: "completed", label: "Terminé", icon: CheckCircle2, color: "text-emerald-400" },
  { value: "delayed", label: "En retard", icon: AlertTriangle, color: "text-amber-400" },
  { value: "cancelled", label: "Annulé", icon: XCircle, color: "text-rose-400" },
];

const taskStatusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: "backlog", label: "Backlog", color: "bg-neutral-600" },
  { value: "todo", label: "À faire", color: "bg-neutral-500" },
  { value: "in_progress", label: "En cours", color: "bg-cyan-500" },
  { value: "review", label: "En revue", color: "bg-indigo-500" },
  { value: "done", label: "Terminé", color: "bg-emerald-500" },
  { value: "blocked", label: "Bloqué", color: "bg-rose-500" },
];

const taskPriorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Basse", color: "text-neutral-400" },
  { value: "medium", label: "Moyenne", color: "text-blue-400" },
  { value: "high", label: "Haute", color: "text-amber-400" },
  { value: "urgent", label: "Urgente", color: "text-rose-400" },
];

export function RoadmapDrawer({
  type,
  item,
  parentMilestone,
  isOpen,
  onClose,
  canEdit = false,
  teamMembers = [],
}: RoadmapDrawerProps) {
  const [isPending, startTransition] = useTransition();

  if (!item) return null;

  const isMilestone = type === "milestone";
  const milestone = isMilestone ? (item as GanttMilestone) : null;
  const task = !isMilestone ? (item as Task) : null;

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      if (isMilestone && milestone) {
        const result = await updateMilestoneStatus(milestone.id, newStatus as MilestoneStatus);
        if (result.success) {
          toast.success("Statut mis à jour");
        } else {
          toast.error(result.error || "Erreur");
        }
      } else if (task) {
        const result = await updateTaskStatus(task.id, newStatus as TaskStatus);
        if (result.success) {
          toast.success("Statut mis à jour");
        } else {
          toast.error(result.error || "Erreur");
        }
      }
    });
  };

  const handleDateChange = (field: "start" | "end", value: string) => {
    startTransition(async () => {
      if (isMilestone && milestone) {
        const startDate = field === "start" ? value : milestone.start_date;
        const endDate = field === "end" ? value : milestone.target_date;
        const result = await updateMilestoneDates(milestone.id, startDate, endDate);
        if (result.success) {
          toast.success("Dates mises à jour");
        } else {
          toast.error(result.error || "Erreur");
        }
      } else if (task) {
        const startDate = field === "start" ? value : task.start_date;
        const dueDate = field === "end" ? value : task.due_date;
        const result = await updateTaskDates(task.id, startDate, dueDate);
        if (result.success) {
          toast.success("Dates mises à jour");
        } else {
          toast.error(result.error || "Erreur");
        }
      }
    });
  };

  const handleProgressChange = (value: number) => {
    if (!isMilestone || !milestone) return;
    
    startTransition(async () => {
      const result = await updateMilestone(milestone.id, { progress_percent: value });
      if (result.success) {
        toast.success("Progression mise à jour");
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  const handleAssigneeChange = (userId: string) => {
    if (!task) return;
    
    startTransition(async () => {
      const result = await updateTaskAssignee(task.id, userId === "unassigned" ? null : userId);
      if (result.success) {
        toast.success("Assigné mis à jour");
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Supprimer ${isMilestone ? "ce jalon" : "cette tâche"} ?`)) return;

    startTransition(async () => {
      if (isMilestone && milestone) {
        const result = await deleteMilestone(milestone.id);
        if (result.success) {
          toast.success("Jalon supprimé");
          onClose();
        } else {
          toast.error(result.error || "Erreur");
        }
      } else if (task) {
        const result = await deleteTask(task.id);
        if (result.success) {
          toast.success("Tâche supprimée");
          onClose();
        } else {
          toast.error(result.error || "Erreur");
        }
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md border-l border-white/10 bg-neutral-950">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white">
              {isMilestone ? "Détails du jalon" : "Détails de la tâche"}
            </SheetTitle>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isPending}
                className="h-8 w-8 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isMilestone ? milestone?.title : task?.title}
            </h2>
            {!isMilestone && parentMilestone && (
              <p className="text-sm text-neutral-500 mt-1">
                Jalon: {parentMilestone.title}
              </p>
            )}
          </div>

          {/* Description */}
          {(isMilestone ? milestone?.description : task?.description) && (
            <div className="text-sm text-neutral-400">
              {isMilestone ? milestone?.description : task?.description}
            </div>
          )}

          <Separator className="bg-white/5" />

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-neutral-400">Statut</Label>
            {canEdit ? (
              <Select
                value={isMilestone ? milestone?.status : task?.status}
                onValueChange={handleStatusChange}
                disabled={isPending}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(isMilestone ? milestoneStatusOptions : taskStatusOptions).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        {isMilestone && "icon" in opt && (
                          <opt.icon className={cn("h-4 w-4", opt.color)} />
                        )}
                        {!isMilestone && (
                          <div className={cn("h-2 w-2 rounded-full", opt.color)} />
                        )}
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-white">
                {isMilestone
                  ? milestoneStatusOptions.find((o) => o.value === milestone?.status)?.label
                  : taskStatusOptions.find((o) => o.value === task?.status)?.label}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-400">Date de début</Label>
              {canEdit ? (
                <Input
                  type="date"
                  value={isMilestone ? milestone?.start_date || "" : task?.start_date || ""}
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  disabled={isPending}
                  className="bg-white/[0.02] border-white/10"
                />
              ) : (
                <div className="text-sm text-white">
                  {(isMilestone ? milestone?.start_date : task?.start_date) || "Non définie"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400">
                {isMilestone ? "Date cible" : "Date d'échéance"}
              </Label>
              {canEdit ? (
                <Input
                  type="date"
                  value={isMilestone ? milestone?.target_date || "" : task?.due_date || ""}
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  disabled={isPending}
                  className="bg-white/[0.02] border-white/10"
                />
              ) : (
                <div className="text-sm text-white">
                  {(isMilestone ? milestone?.target_date : task?.due_date) || "Non définie"}
                </div>
              )}
            </div>
          </div>

          {/* Progress (Milestones only) */}
          {isMilestone && milestone && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-neutral-400">Progression</Label>
                <span className="text-sm font-medium text-white">{milestone.progress_percent}%</span>
              </div>
              {canEdit ? (
                <Input
                  type="range"
                  min={0}
                  max={100}
                  value={milestone.progress_percent}
                  onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                  disabled={isPending}
                  className="accent-emerald-500"
                />
              ) : (
                <Progress value={milestone.progress_percent} className="h-2" />
              )}
            </div>
          )}

          {/* Assignee (Tasks only) */}
          {!isMilestone && task && (
            <div className="space-y-2">
              <Label className="text-neutral-400">Assigné à</Label>
              {canEdit ? (
                <Select
                  value={task.assignee_id || "unassigned"}
                  onValueChange={handleAssigneeChange}
                  disabled={isPending}
                >
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue placeholder="Non assigné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Non assigné</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <span className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {member.user?.full_name || member.user?.email}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-white">
                  {teamMembers.find((m) => m.user_id === task.assignee_id)?.user?.full_name || "Non assigné"}
                </div>
              )}
            </div>
          )}

          {/* Priority (Tasks only) */}
          {!isMilestone && task && (
            <div className="space-y-2">
              <Label className="text-neutral-400">Priorité</Label>
              <div className="flex items-center gap-2">
                <Flag className={cn("h-4 w-4", taskPriorityOptions.find((o) => o.value === task.priority)?.color)} />
                <span className="text-sm text-white capitalize">
                  {taskPriorityOptions.find((o) => o.value === task.priority)?.label}
                </span>
              </div>
            </div>
          )}

          {/* Tasks List (Milestones only) */}
          {isMilestone && milestone && milestone.tasks.length > 0 && (
            <div className="space-y-2">
              <Label className="text-neutral-400">Tâches ({milestone.tasks.length})</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {milestone.tasks.map((t) => {
                  const statusCfg = taskStatusOptions.find((o) => o.value === t.status);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded bg-white/[0.02]"
                    >
                      <div className={cn("h-2 w-2 rounded-full", statusCfg?.color)} />
                      <span className={cn(
                        "flex-1 text-sm truncate",
                        t.status === "done" ? "text-neutral-500 line-through" : "text-neutral-300"
                      )}>
                        {t.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/50">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

