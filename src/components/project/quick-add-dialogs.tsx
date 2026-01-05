"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createQuickMilestone, createQuickTask } from "@/lib/actions/roadmap";

interface AddMilestoneDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddMilestoneDialog({ projectId, isOpen, onClose }: AddMilestoneDialogProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!title.trim() || !targetDate) {
      toast.error("Titre et date cible sont requis");
      return;
    }

    startTransition(async () => {
      const result = await createQuickMilestone({
        project_id: projectId,
        title: title.trim(),
        start_date: startDate || undefined,
        target_date: targetDate,
      });

      if (result.success) {
        toast.success("Jalon créé");
        setTitle("");
        setStartDate("");
        onClose();
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-neutral-900 border-white/10">
        <DialogHeader>
          <DialogTitle>Nouveau jalon</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="milestone-title">Titre *</Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Phase 1: MVP"
              className="bg-white/[0.02] border-white/10"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-start">Date de début</Label>
              <Input
                id="milestone-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/[0.02] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-target">Date cible *</Label>
              <Input
                id="milestone-target"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-white/[0.02] border-white/10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !targetDate}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddTaskDialogProps {
  projectId: string;
  milestoneId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddTaskDialog({ projectId, milestoneId, isOpen, onClose }: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Titre requis");
      return;
    }

    startTransition(async () => {
      const result = await createQuickTask({
        project_id: projectId,
        milestone_id: milestoneId,
        title: title.trim(),
        start_date: startDate || undefined,
        due_date: dueDate || undefined,
      });

      if (result.success) {
        toast.success("Tâche créée");
        setTitle("");
        setStartDate("");
        setDueDate("");
        onClose();
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-neutral-900 border-white/10">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Titre *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Développer la fonctionnalité X"
              className="bg-white/[0.02] border-white/10"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-start">Date de début</Label>
              <Input
                id="task-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/[0.02] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Date d'échéance</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-white/[0.02] border-white/10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title.trim()}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

