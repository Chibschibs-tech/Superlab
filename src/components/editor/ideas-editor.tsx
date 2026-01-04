"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Plus, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
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
import type { Idea, IdeaStatus } from "@/types";

interface IdeasEditorProps {
  projectId: string;
  ideas: Idea[];
  currentUserId?: string;
}

const statusConfig: Record<IdeaStatus, { label: string; color: string }> = {
  submitted: { label: "Soumise", color: "text-blue-400 bg-blue-500/20" },
  under_review: { label: "En revue", color: "text-amber-400 bg-amber-500/20" },
  approved: { label: "Approuvée", color: "text-emerald-400 bg-emerald-500/20" },
  rejected: { label: "Rejetée", color: "text-rose-400 bg-rose-500/20" },
  implemented: { label: "Implémentée", color: "text-violet-400 bg-violet-500/20" },
};

export function IdeasEditor({ projectId, ideas, currentUserId }: IdeasEditorProps) {
  const [localIdeas, setLocalIdeas] = useState<Idea[]>(ideas);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    startTransition(async () => {
      const fakeIdea: Idea = {
        id: crypto.randomUUID(),
        project_id: projectId,
        title,
        description: description || null,
        status: "submitted",
        author_id: currentUserId || "",
        votes_up: 0,
        votes_down: 0,
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLocalIdeas((prev) => [fakeIdea, ...prev]);
      toast.success("Idée soumise");
      setIsDialogOpen(false);
    });
  };

  const handleVote = (ideaId: string, voteType: "up" | "down") => {
    setLocalIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id === ideaId) {
          return {
            ...idea,
            votes_up: voteType === "up" ? idea.votes_up + 1 : idea.votes_up,
            votes_down: voteType === "down" ? idea.votes_down + 1 : idea.votes_down,
          };
        }
        return idea;
      })
    );
  };

  // Sort by votes (up - down)
  const sortedIdeas = [...localIdeas].sort((a, b) => {
    const scoreA = a.votes_up - a.votes_down;
    const scoreB = b.votes_up - b.votes_down;
    return scoreB - scoreA;
  });

  return (
    <Card className="border-white/5 bg-neutral-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-orange-400" />
          Boîte à idées
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4" />
              Proposer une idée
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-neutral-900">
            <DialogHeader>
              <DialogTitle className="text-white">Proposer une idée</DialogTitle>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  className="border-white/10 bg-white/5"
                  placeholder="Résumez votre idée"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  className="border-white/10 bg-white/5"
                  placeholder="Décrivez votre idée en détail..."
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending} className="bg-orange-600 hover:bg-orange-700">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Soumettre"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sortedIdeas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Lightbulb className="h-12 w-12 text-neutral-600" />
            <p className="mt-4 text-lg font-medium text-white">Aucune idée</p>
            <p className="mt-1 text-sm text-neutral-400">
              Proposez des idées pour améliorer le projet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedIdeas.map((idea) => {
              const config = statusConfig[idea.status];
              const score = idea.votes_up - idea.votes_down;

              return (
                <div
                  key={idea.id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex gap-4">
                    {/* Votes */}
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-neutral-400 hover:text-emerald-400"
                        onClick={() => handleVote(idea.id, "up")}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          score > 0 ? "text-emerald-400" : score < 0 ? "text-rose-400" : "text-neutral-400"
                        )}
                      >
                        {score > 0 ? `+${score}` : score}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-neutral-400 hover:text-rose-400"
                        onClick={() => handleVote(idea.id, "down")}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-white">{idea.title}</p>
                        <Badge variant="outline" className={cn("border-transparent text-xs", config.color)}>
                          {config.label}
                        </Badge>
                      </div>
                      {idea.description && (
                        <p className="mt-2 text-sm text-neutral-400">{idea.description}</p>
                      )}
                      <p className="mt-2 text-xs text-neutral-500">
                        {new Date(idea.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
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

