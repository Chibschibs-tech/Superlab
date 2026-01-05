"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateProjectTheAsk } from "@/lib/actions/editor";

interface TheAskEditorProps {
  projectId: string;
  initialTheAsk: string | null;
}

export function TheAskEditor({ projectId, initialTheAsk }: TheAskEditorProps) {
  const [theAsk, setTheAsk] = useState(initialTheAsk ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProjectTheAsk(projectId, theAsk);
    setIsSaving(false);

    if (result.success) {
      setIsSaved(true);
      toast.success("Demande enregistrée");
    } else {
      toast.error(result.error ?? "Erreur lors de la sauvegarde");
    }
  };

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-neutral-900 to-neutral-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-amber-400" />
            La Demande (The Ask)
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isSaved && (
              <span className="text-xs text-amber-400">Non enregistré</span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={cn(
                "h-8",
                isSaved
                  ? "bg-white/5 text-neutral-400"
                  : "bg-amber-600 hover:bg-amber-500 text-white"
              )}
            >
              {isSaving ? "..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={theAsk}
          onChange={(e) => {
            setTheAsk(e.target.value);
            setIsSaved(false);
          }}
          placeholder="Décrivez ce dont vous avez besoin : budget, ressources humaines, équipement, validation..."
          className={cn(
            "min-h-[180px] resize-y",
            "bg-white/[0.02] border-amber-500/20",
            "focus:border-amber-500/50 focus:ring-amber-500/20",
            "placeholder:text-neutral-500"
          )}
          aria-label="La demande du projet"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Cette demande sera présentée au dirigeant dans le Showroom pour approbation.
        </p>
      </CardContent>
    </Card>
  );
}

