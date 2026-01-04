"use client";

import { useState, useTransition } from "react";
import {
  ListTodo,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CircleDot,
  Loader2,
  Filter,
  User,
  Flag,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertOctagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createTask, updateTask, deleteTask } from "@/lib/actions/editor";
import type { Task, TaskStatus, TaskPriority, Milestone } from "@/types";

interface TaskManagerProps {
  projectId: string;
  tasks: Task[];
  milestones: Milestone[];
}

const statusConfig: Record<TaskStatus, { label: string; icon: typeof CircleDot; color: string; bg: string }> = {
  backlog: { label: "Backlog", icon: CircleDot, color: "text-neutral-400", bg: "bg-neutral-500/20" },
  todo: { label: "À faire", icon: ListTodo, color: "text-blue-400", bg: "bg-blue-500/20" },
  in_progress: { label: "En cours", icon: Clock, color: "text-cyan-400", bg: "bg-cyan-500/20" },
  review: { label: "Review", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/20" },
  done: { label: "Terminé", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  blocked: { label: "Bloqué", icon: AlertOctagon, color: "text-rose-400", bg: "bg-rose-500/20" },
};

const priorityConfig: Record<TaskPriority, { label: string; icon: typeof Minus; color: string }> = {
  low: { label: "Basse", icon: ArrowDown, color: "text-neutral-400" },
  medium: { label: "Moyenne", icon: Minus, color: "text-blue-400" },
  high: { label: "Haute", icon: ArrowUp, color: "text-amber-400" },
  urgent: { label: "Urgente", icon: Flag, color: "text-rose-400" },
};

interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  milestone_id: string;
  due_date: string;
  estimated_hours: string;
}

const defaultFormData: TaskFormData = {
  title: "",
  description: "",
  status: "backlog",
  priority: "medium",
  milestone_id: "",
  due_date: "",
  estimated_hours: "",
};

export function TaskManager({ projectId, tasks, milestones }: TaskManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(defaultFormData);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [isPending, startTransition] = useTransition();

  const filteredTasks = filterStatus === "all" 
    ? tasks 
    : tasks.filter((t) => t.status === filterStatus);

  const tasksByStatus = {
    active: filteredTasks.filter((t) => !["done", "backlog"].includes(t.status)),
    backlog: filteredTasks.filter((t) => t.status === "backlog"),
    done: filteredTasks.filter((t) => t.status === "done"),
  };

  const openCreateDialog = () => {
    setEditingTask(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      milestone_id: task.milestone_id ?? "",
      due_date: task.due_date ?? "",
      estimated_hours: task.estimated_hours?.toString() ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    startTransition(async () => {
      if (editingTask) {
        const result = await updateTask(editingTask.id, {
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          milestone_id: formData.milestone_id || null,
          due_date: formData.due_date || null,
          estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        });

        if (result.success) {
          toast.success("Tâche mise à jour");
          setIsDialogOpen(false);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createTask({
          project_id: projectId,
          title: formData.title,
          description: formData.description || undefined,
          status: formData.status,
          priority: formData.priority,
          milestone_id: formData.milestone_id || undefined,
          due_date: formData.due_date || undefined,
          estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
        });

        if (result.success) {
          toast.success("Tâche créée");
          setIsDialogOpen(false);
        } else {
          toast.error(result.error);
        }
      }
    });
  };

  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      const result = await deleteTask(taskId);
      if (result.success) {
        toast.success("Tâche supprimée");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggleDone = (task: Task) => {
    startTransition(async () => {
      const newStatus = task.status === "done" ? "todo" : "done";
      const result = await updateTask(task.id, { status: newStatus });
      if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  const handleQuickStatusChange = (task: Task, newStatus: TaskStatus) => {
    startTransition(async () => {
      const result = await updateTask(task.id, { status: newStatus });
      if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const getMilestoneName = (milestoneId: string | null) => {
    if (!milestoneId) return null;
    return milestones.find((m) => m.id === milestoneId)?.title;
  };

  return (
    <>
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListTodo className="h-5 w-5 text-blue-400" />
              Tâches
              <Badge variant="secondary" className="ml-1 bg-white/10 text-xs">
                {tasks.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-white/10 bg-white/5">
                    <Filter className="mr-1.5 h-3.5 w-3.5" />
                    {filterStatus === "all" ? "Tous" : statusConfig[filterStatus].label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                    Tous
                  </DropdownMenuItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <DropdownMenuItem key={key} onClick={() => setFilterStatus(key as TaskStatus)}>
                      <config.icon className={cn("mr-2 h-4 w-4", config.color)} />
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                onClick={openCreateDialog}
                className="h-8 bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ajouter</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <ListTodo className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-400">Aucune tâche</p>
              <p className="text-xs text-neutral-500 mt-1">
                Créez des tâches pour suivre le travail
              </p>
            </div>
          ) : (
            <>
              {/* Active Tasks */}
              {tasksByStatus.active.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    En cours ({tasksByStatus.active.length})
                  </p>
                  <div className="space-y-1.5">
                    {tasksByStatus.active.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        milestoneName={getMilestoneName(task.milestone_id)}
                        onEdit={() => openEditDialog(task)}
                        onDelete={() => handleDelete(task.id)}
                        onToggleDone={() => handleToggleDone(task)}
                        onStatusChange={(status) => handleQuickStatusChange(task, status)}
                        isPending={isPending}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Backlog */}
              {tasksByStatus.backlog.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Backlog ({tasksByStatus.backlog.length})
                  </p>
                  <div className="space-y-1.5">
                    {tasksByStatus.backlog.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        milestoneName={getMilestoneName(task.milestone_id)}
                        onEdit={() => openEditDialog(task)}
                        onDelete={() => handleDelete(task.id)}
                        onToggleDone={() => handleToggleDone(task)}
                        onStatusChange={(status) => handleQuickStatusChange(task, status)}
                        isPending={isPending}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Done */}
              {tasksByStatus.done.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                    Terminé ({tasksByStatus.done.length})
                  </p>
                  <div className="space-y-1.5">
                    {tasksByStatus.done.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        milestoneName={getMilestoneName(task.milestone_id)}
                        onEdit={() => openEditDialog(task)}
                        onDelete={() => handleDelete(task.id)}
                        onToggleDone={() => handleToggleDone(task)}
                        onStatusChange={(status) => handleQuickStatusChange(task, status)}
                        isPending={isPending}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-neutral-900 border-white/10">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Implémenter la fonctionnalité X"
                className="bg-white/[0.02] border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Détails de la tâche..."
                className="bg-white/[0.02] border-white/10 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as TaskStatus })}
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
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v as TaskPriority })}
                >
                  <SelectTrigger className="bg-white/[0.02] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="milestone">Jalon</Label>
              <Select
                value={formData.milestone_id}
                onValueChange={(v) => setFormData({ ...formData, milestone_id: v })}
              >
                <SelectTrigger className="bg-white/[0.02] border-white/10">
                  <SelectValue placeholder="Aucun jalon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun jalon</SelectItem>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Échéance</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="bg-white/[0.02] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Heures estimées</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  min={0}
                  step={0.5}
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder="Ex: 4"
                  className="bg-white/[0.02] border-white/10"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/10">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-blue-600 hover:bg-blue-500">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingTask ? (
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

// Task Card Component
function TaskCard({
  task,
  milestoneName,
  onEdit,
  onDelete,
  onToggleDone,
  onStatusChange,
  isPending,
  formatDate,
}: {
  task: Task;
  milestoneName: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
  onStatusChange: (status: TaskStatus) => void;
  isPending: boolean;
  formatDate: (date: string) => string;
}) {
  const statusCfg = statusConfig[task.status];
  const priorityCfg = priorityConfig[task.priority];
  const PriorityIcon = priorityCfg.icon;
  const isDone = task.status === "done";

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border p-3 transition-colors",
        isDone
          ? "border-white/5 bg-white/[0.01] opacity-60"
          : "border-white/5 bg-white/[0.02] hover:border-white/10"
      )}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={onToggleDone}
        disabled={isPending}
        className="mt-0.5 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        aria-label={isDone ? "Marquer comme non terminé" : "Marquer comme terminé"}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "font-medium text-sm",
            isDone ? "text-neutral-500 line-through" : "text-white"
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-6 w-6 text-neutral-400 hover:text-white"
              aria-label="Modifier"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isPending}
              className="h-6 w-6 text-neutral-400 hover:text-rose-400"
              aria-label="Supprimer"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {/* Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                statusCfg.bg, statusCfg.color,
                "hover:opacity-80"
              )}>
                <statusCfg.icon className="h-3 w-3" />
                {statusCfg.label}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {Object.entries(statusConfig).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onStatusChange(key as TaskStatus)}
                  disabled={isPending}
                >
                  <config.icon className={cn("mr-2 h-4 w-4", config.color)} />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority */}
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[10px]",
            priorityCfg.color
          )}>
            <PriorityIcon className="h-3 w-3" />
          </span>

          {/* Due date */}
          {task.due_date && (
            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
              <Calendar className="h-3 w-3" />
              {formatDate(task.due_date)}
            </span>
          )}

          {/* Milestone */}
          {milestoneName && (
            <span className="text-[10px] text-violet-400 truncate max-w-[100px]">
              {milestoneName}
            </span>
          )}

          {/* Estimated hours */}
          {task.estimated_hours && (
            <span className="text-[10px] text-neutral-500">
              {task.estimated_hours}h
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


