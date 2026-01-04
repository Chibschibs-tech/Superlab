"use client";

import { useState, useTransition } from "react";
import { CircleCheckBig, Plus, Clock, CheckCircle2, XCircle, HelpCircle, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Decision, DecisionStatus } from "@/types";

interface DecisionsEditorProps {
  projectId: string;
  decisions: Decision[];
}

const statusConfig: Record<DecisionStatus, { label: string; icon: typeof Clock; color: string }> = {
  Pending: { label: "En attente", icon: Clock, color: "text-amber-400 bg-amber-500/20" },
  InfoRequested: { label: "Info demandée", icon: HelpCircle, color: "text-cyan-400 bg-cyan-500/20" },
  Approved: { label: "Approuvé", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/20" },
  Rejected: { label: "Rejeté", icon: XCircle, color: "text-rose-400 bg-rose-500/20" },
};

export function DecisionsEditor({ projectId, decisions }: DecisionsEditorProps) {
  const [localDecisions, setLocalDecisions] = useState<Decision[]>(decisions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (formData: FormData) => {
    const question = formData.get("question") as string;
    const optionsText = formData.get("options") as string;
    const options = optionsText.split("\n").filter((o) => o.trim());

    startTransition(async () => {
      const fakeDecision: Decision = {
        id: crypto.randomUUID(),
        project_id: projectId,
        question,
        options,
        status: "Pending",
        decided_by: null,
        decided_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLocalDecisions((prev) => [fakeDecision, ...prev]);
      toast.success("Demande de décision créée");
      setIsDialogOpen(false);
    });
  };

  const pendingDecisions = localDecisions.filter((d) => d.status === "Pending" || d.status === "InfoRequested");
  const resolvedDecisions = localDecisions.filter((d) => d.status === "Approved" || d.status === "Rejected");

  return (
    <Card className="border-white/5 bg-neutral-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CircleCheckBig className="h-5 w-5 text-indigo-400" />
          Décisions
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              Nouvelle demande
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-neutral-900">
            <DialogHeader>
              <DialogTitle className="text-white">Nouvelle demande de décision</DialogTitle>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Textarea
                  id="question"
                  name="question"
                  required
                  className="border-white/10 bg-white/5"
                  placeholder="Quelle décision doit être prise ?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="options">Options (une par ligne)</Label>
                <Textarea
                  id="options"
                  name="options"
                  className="border-white/10 bg-white/5"
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {localDecisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CircleCheckBig className="h-12 w-12 text-neutral-600" />
            <p className="mt-4 text-lg font-medium text-white">Aucune décision</p>
            <p className="mt-1 text-sm text-neutral-400">
              Créez des demandes de décision pour les soumettre à la direction
            </p>
          </div>
        ) : (
          <>
            {pendingDecisions.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
                  En attente ({pendingDecisions.length})
                </h3>
                <div className="space-y-3">
                  {pendingDecisions.map((decision) => (
                    <DecisionCard key={decision.id} decision={decision} />
                  ))}
                </div>
              </div>
            )}
            {resolvedDecisions.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
                  Résolues ({resolvedDecisions.length})
                </h3>
                <div className="space-y-3 opacity-60">
                  {resolvedDecisions.map((decision) => (
                    <DecisionCard key={decision.id} decision={decision} />
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

function DecisionCard({ decision }: { decision: Decision }) {
  const config = statusConfig[decision.status];
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-white">{decision.question}</p>
          {decision.options.length > 0 && (
            <div className="mt-2 space-y-1">
              {decision.options.map((option, i) => (
                <p key={i} className="text-sm text-neutral-400">
                  • {option}
                </p>
              ))}
            </div>
          )}
        </div>
        <Badge variant="outline" className={cn("ml-3 gap-1 border-transparent", config.color)}>
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Créée le {new Date(decision.created_at).toLocaleDateString("fr-FR")}
      </p>
    </div>
  );
}

