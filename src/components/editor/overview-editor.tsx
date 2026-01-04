"use client";

import { useState, useTransition } from "react";
import { FileText, Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateProjectOverview } from "@/lib/actions/editor";

interface OverviewEditorProps {
  projectId: string;
  initialContent: string | null;
}

export function OverviewEditor({ projectId, initialContent }: OverviewEditorProps) {
  const [content, setContent] = useState(initialContent ?? "");
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(true);

  const handleChange = (value: string) => {
    setContent(value);
    setIsSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProjectOverview(projectId, content);
      
      if (result.success) {
        setIsSaved(true);
        toast.success("Description enregistrée");
      } else {
        toast.error(result.error ?? "Erreur lors de la sauvegarde");
      }
    });
  };

  return (
    <Card className="border-white/10 bg-white/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-violet-400" />
            Description du Projet
          </CardTitle>
          <div className="flex items-center gap-2">
            {isSaved ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3 w-3" />
                Enregistré
              </span>
            ) : (
              <span className="text-xs text-amber-400">Non enregistré</span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || isSaved}
              className={cn(
                "h-8",
                isSaved
                  ? "bg-white/5 text-neutral-400"
                  : "bg-violet-600 hover:bg-violet-500 text-white"
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Décrivez votre projet en détail. Expliquez le problème que vous résolvez, la solution proposée, et l'impact attendu..."
          className={cn(
            "min-h-[200px] resize-y",
            "bg-white/[0.02] border-white/10",
            "focus:border-violet-500/50 focus:ring-violet-500/20",
            "placeholder:text-neutral-500"
          )}
          aria-label="Description du projet"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Utilisez des paragraphes clairs pour structurer votre description.
          {content.length > 0 && (
            <span className="ml-2 text-neutral-400">{content.length} caractères</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}


