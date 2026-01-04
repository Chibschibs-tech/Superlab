"use client";

import { useState, useTransition } from "react";
import { Sparkles, Save, Loader2, Check, Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateProjectHighlights } from "@/lib/actions/editor";

interface HighlightsEditorProps {
  projectId: string;
  initialHighlights: string[] | string | null;
}

export function HighlightsEditor({ projectId, initialHighlights }: HighlightsEditorProps) {
  // Parse highlights - handle both array (JSONB) and string formats
  const parseHighlights = (input: string[] | string | null): string[] => {
    if (!input) return [""];
    // If it's already an array, use it directly
    if (Array.isArray(input)) {
      return input.length > 0 ? input : [""];
    }
    // If it's a string, split by newline
    if (typeof input === "string") {
      const lines = input.split("\n").filter(Boolean);
      return lines.length > 0 ? lines : [""];
    }
    return [""];
  };

  const [highlights, setHighlights] = useState<string[]>(parseHighlights(initialHighlights));
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(true);

  const handleChange = (index: number, value: string) => {
    const updated = [...highlights];
    updated[index] = value;
    setHighlights(updated);
    setIsSaved(false);
  };

  const addHighlight = () => {
    setHighlights([...highlights, ""]);
    setIsSaved(false);
  };

  const removeHighlight = (index: number) => {
    if (highlights.length === 1) return;
    setHighlights(highlights.filter((_, i) => i !== index));
    setIsSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      // Filter out empty highlights and save as array
      const cleanedHighlights = highlights.filter((h) => h.trim() !== "");
      const result = await updateProjectHighlights(projectId, cleanedHighlights);
      
      if (result.success) {
        setIsSaved(true);
        toast.success("Points clés enregistrés");
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
            <Sparkles className="h-5 w-5 text-amber-400" />
            Points Clés / Highlights
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
                  : "bg-amber-600 hover:bg-amber-500 text-white"
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
      <CardContent className="space-y-3">
        {highlights.map((highlight, index) => (
          <div key={index} className="group flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-medium text-amber-400">
              {index + 1}
            </div>
            <Input
              value={highlight}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={`Point clé ${index + 1}...`}
              className={cn(
                "flex-1",
                "bg-white/[0.02] border-white/10",
                "focus:border-amber-500/50 focus:ring-amber-500/20",
                "placeholder:text-neutral-500"
              )}
              aria-label={`Point clé ${index + 1}`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeHighlight(index)}
              disabled={highlights.length === 1}
              className="h-8 w-8 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30"
              aria-label="Supprimer ce point"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={addHighlight}
          className="w-full mt-2 border-dashed border-white/10 bg-transparent text-neutral-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter un point clé
        </Button>
        
        <p className="text-xs text-neutral-500">
          Les points clés apparaîtront dans le Showroom pour mettre en avant les réalisations principales.
        </p>
      </CardContent>
    </Card>
  );
}

