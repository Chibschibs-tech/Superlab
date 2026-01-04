"use client";

import { useState, useTransition } from "react";
import { Clock, Plus, Loader2, Flag, AlertTriangle, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import type { ProjectUpdate, UpdateType } from "@/types";

interface UpdatesEditorProps {
  projectId: string;
  updates: ProjectUpdate[];
}

const updateTypeConfig: Record<UpdateType, { label: string; icon: typeof Clock; color: string }> = {
  Milestone: { label: "Jalon", icon: Flag, color: "text-emerald-400 bg-emerald-500/20" },
  Blocker: { label: "Bloqueur", icon: AlertTriangle, color: "text-rose-400 bg-rose-500/20" },
  General: { label: "Général", icon: MessageCircle, color: "text-blue-400 bg-blue-500/20" },
};

export function UpdatesEditor({ projectId, updates }: UpdatesEditorProps) {
  const [localUpdates, setLocalUpdates] = useState<ProjectUpdate[]>(updates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (formData: FormData) => {
    const content = formData.get("content") as string;
    const type = formData.get("type") as UpdateType;

    startTransition(async () => {
      const fakeUpdate: ProjectUpdate = {
        id: crypto.randomUUID(),
        project_id: projectId,
        author_id: "",
        content,
        type,
        created_at: new Date().toISOString(),
      };
      setLocalUpdates((prev) => [fakeUpdate, ...prev]);
      toast.success("Mise à jour publiée");
      setIsDialogOpen(false);
    });
  };

  return (
    <Card className="border-white/5 bg-neutral-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-teal-400" />
          Journal des mises à jour
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4" />
              Nouvelle mise à jour
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-neutral-900">
            <DialogHeader>
              <DialogTitle className="text-white">Publier une mise à jour</DialogTitle>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue="General">
                  <SelectTrigger className="border-white/10 bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(updateTypeConfig).map(([key, config]) => (
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
                <Label htmlFor="content">Contenu *</Label>
                <Textarea
                  id="content"
                  name="content"
                  required
                  className="border-white/10 bg-white/5"
                  placeholder="Décrivez la mise à jour..."
                  rows={5}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending} className="bg-teal-600 hover:bg-teal-700">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publier"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {localUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-neutral-600" />
            <p className="mt-4 text-lg font-medium text-white">Aucune mise à jour</p>
            <p className="mt-1 text-sm text-neutral-400">
              Publiez des mises à jour régulières sur l'avancement du projet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {localUpdates.map((update) => {
              const config = updateTypeConfig[update.type];
              const Icon = config.icon;
              return (
                <div
                  key={update.id}
                  className="relative border-l-2 border-white/10 pl-4"
                >
                  <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-neutral-800 ring-2 ring-white/10" />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("gap-1 border-transparent text-xs", config.color)}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        <span className="text-xs text-neutral-500">
                          {new Date(update.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">{update.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

