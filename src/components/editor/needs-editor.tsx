"use client";

import { useState, useTransition } from "react";
import {
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  DollarSign,
  Users,
  Briefcase,
  Scale,
  Package,
  MoreHorizontal,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Need, NeedType, NeedStatus, Milestone } from "@/types";

interface NeedsEditorProps {
  projectId: string;
  needs: Need[];
  milestones: Milestone[];
}

const needTypeConfig: Record<NeedType, { label: string; icon: typeof DollarSign; color: string }> = {
  Budget: { label: "Budget", icon: DollarSign, color: "text-emerald-400 bg-emerald-500/20" },
  Hiring: { label: "Recrutement", icon: Users, color: "text-blue-400 bg-blue-500/20" },
  Intro: { label: "Introduction", icon: Briefcase, color: "text-violet-400 bg-violet-500/20" },
  Legal: { label: "Juridique", icon: Scale, color: "text-amber-400 bg-amber-500/20" },
  Supplier: { label: "Fournisseur", icon: Package, color: "text-cyan-400 bg-cyan-500/20" },
  Other: { label: "Autre", icon: MoreHorizontal, color: "text-neutral-400 bg-neutral-500/20" },
};

const needStatusConfig: Record<NeedStatus, { label: string; color: string }> = {
  Open: { label: "Ouvert", color: "text-blue-400 bg-blue-500/20" },
  InReview: { label: "En revue", color: "text-amber-400 bg-amber-500/20" },
  Fulfilled: { label: "Satisfait", color: "text-emerald-400 bg-emerald-500/20" },
  Rejected: { label: "Rejeté", color: "text-rose-400 bg-rose-500/20" },
};

export function NeedsEditor({ projectId, needs, milestones }: NeedsEditorProps) {
  const [localNeeds, setLocalNeeds] = useState<Need[]>(needs);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState<Need | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (formData: FormData) => {
    const newNeed: Partial<Need> = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      type: formData.get("type") as NeedType,
      urgency: parseInt(formData.get("urgency") as string, 10),
      deadline: formData.get("deadline") as string || null,
      milestone_id: formData.get("milestone_id") as string || null,
    };

    startTransition(async () => {
      if (editingNeed) {
        setLocalNeeds((prev) =>
          prev.map((n) => (n.id === editingNeed.id ? { ...n, ...newNeed } : n))
        );
        toast.success("Besoin mis à jour");
      } else {
        const fakeNeed: Need = {
          id: crypto.randomUUID(),
          project_id: projectId,
          status: "Open",
          decision_id: null,
          created_by: "",
          fulfilled_by: null,
          fulfilled_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newNeed,
        } as Need;
        setLocalNeeds((prev) => [...prev, fakeNeed]);
        toast.success("Besoin ajouté");
      }
      setIsDialogOpen(false);
      setEditingNeed(null);
    });
  };

  const handleDelete = (needId: string) => {
    startTransition(async () => {
      setLocalNeeds((prev) => prev.filter((n) => n.id !== needId));
      toast.success("Besoin supprimé");
    });
  };

  const openNeeds = localNeeds.filter((n) => n.status === "Open" || n.status === "InReview");
  const closedNeeds = localNeeds.filter((n) => n.status === "Fulfilled" || n.status === "Rejected");

  return (
    <Card className="border-white/5 bg-neutral-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="h-5 w-5 text-rose-400" />
          Besoins & Demandes
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 bg-rose-600 hover:bg-rose-700">
              <Plus className="h-4 w-4" />
              Nouveau besoin
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-neutral-900">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingNeed ? "Modifier le besoin" : "Nouveau besoin"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={editingNeed?.title}
                  className="border-white/10 bg-white/5"
                  placeholder="Ex: Budget pour campagne marketing"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select name="type" defaultValue={editingNeed?.type || "Budget"}>
                    <SelectTrigger className="border-white/10 bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(needTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgence (1-5) *</Label>
                  <Select name="urgency" defaultValue={String(editingNeed?.urgency || 3)}>
                    <SelectTrigger className="border-white/10 bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Faible</SelectItem>
                      <SelectItem value="2">2 - Modérée</SelectItem>
                      <SelectItem value="3">3 - Moyenne</SelectItem>
                      <SelectItem value="4">4 - Haute</SelectItem>
                      <SelectItem value="5">5 - Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Date limite</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    defaultValue={editingNeed?.deadline?.split("T")[0] ?? ""}
                    className="border-white/10 bg-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milestone_id">Jalon associé</Label>
                  <Select name="milestone_id" defaultValue={editingNeed?.milestone_id || ""}>
                    <SelectTrigger className="border-white/10 bg-white/5">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {milestones.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingNeed?.description ?? ""}
                  className="border-white/10 bg-white/5"
                  rows={3}
                  placeholder="Décrivez le besoin en détail..."
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingNeed(null);
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending} className="bg-rose-600 hover:bg-rose-700">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {localNeeds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <HelpCircle className="h-12 w-12 text-neutral-600" />
            <p className="mt-4 text-lg font-medium text-white">Aucun besoin</p>
            <p className="mt-1 text-sm text-neutral-400">
              Documentez les besoins du projet : budget, recrutement, introductions...
            </p>
          </div>
        ) : (
          <>
            {/* Open Needs */}
            {openNeeds.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
                  En cours ({openNeeds.length})
                </h3>
                <div className="space-y-3">
                  {openNeeds.map((need) => (
                    <NeedCard
                      key={need.id}
                      need={need}
                      milestones={milestones}
                      onEdit={() => {
                        setEditingNeed(need);
                        setIsDialogOpen(true);
                      }}
                      onDelete={() => handleDelete(need.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Closed Needs */}
            {closedNeeds.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
                  Terminés ({closedNeeds.length})
                </h3>
                <div className="space-y-3 opacity-60">
                  {closedNeeds.map((need) => (
                    <NeedCard
                      key={need.id}
                      need={need}
                      milestones={milestones}
                      onEdit={() => {
                        setEditingNeed(need);
                        setIsDialogOpen(true);
                      }}
                      onDelete={() => handleDelete(need.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function NeedCard({
  need,
  milestones,
  onEdit,
  onDelete,
}: {
  need: Need;
  milestones: Milestone[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeConfig = needTypeConfig[need.type];
  const statusConfig = needStatusConfig[need.status];
  const Icon = typeConfig.icon;
  const milestone = milestones.find((m) => m.id === need.milestone_id);

  return (
    <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <div className={cn("rounded-lg p-2", typeConfig.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-white">{need.title}</p>
              {need.description && (
                <p className="mt-1 text-sm text-neutral-400 line-clamp-2">{need.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("border-transparent text-xs", statusConfig.color)}>
                {statusConfig.label}
              </Badge>
              {need.urgency >= 4 && (
                <AlertCircle className="h-4 w-4 text-rose-400" />
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            {need.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(need.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            )}
            {milestone && (
              <span className="rounded bg-white/5 px-1.5 py-0.5">
                {milestone.title}
              </span>
            )}
            <span>Urgence: {need.urgency}/5</span>
          </div>
        </div>
      </div>
      {/* Actions */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-400 hover:text-white" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-400 hover:text-rose-400" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

