"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Rocket,
  Loader2,
  Sparkles,
  Lock,
  Globe,
  X,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createProject } from "@/lib/actions/projects";
import type { Category, ProjectVisibility, ProjectStatus, UserRole } from "@/types";

// Mock categories for now - will be fetched from DB later
const mockCategories: Category[] = [
  { id: "a1b2c3d4-e5f6-7890-abcd-100000000001", name: "Audiovisuel & Pro AV", slug: "audiovisual-pro-av", type: "project", color: "#8B5CF6", icon: "Video", sort_order: 1, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "a1b2c3d4-e5f6-7890-abcd-100000000002", name: "Retail & E-commerce", slug: "retail-ecommerce", type: "project", color: "#EC4899", icon: "ShoppingBag", sort_order: 2, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "a1b2c3d4-e5f6-7890-abcd-100000000003", name: "Pro Audio Retail", slug: "pro-audio-retail", type: "project", color: "#F59E0B", icon: "Music", sort_order: 3, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "a1b2c3d4-e5f6-7890-abcd-100000000004", name: "Services & Events", slug: "services-events", type: "project", color: "#10B981", icon: "Calendar", sort_order: 4, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "a1b2c3d4-e5f6-7890-abcd-100000000005", name: "Media Production", slug: "media-production", type: "project", color: "#3B82F6", icon: "Film", sort_order: 5, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "a1b2c3d4-e5f6-7890-abcd-100000000006", name: "Tech & AI", slug: "tech-ai", type: "project", color: "#6366F1", icon: "Cpu", sort_order: 6, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "a1b2c3d4-e5f6-7890-abcd-100000000007", name: "Fintech & Procurement", slug: "fintech-procurement", type: "project", color: "#14B8A6", icon: "Wallet", sort_order: 7, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "a1b2c3d4-e5f6-7890-abcd-100000000008", name: "Data & Analytics", slug: "data-analytics", type: "project", color: "#0EA5E9", icon: "BarChart3", sort_order: 8, is_active: true, description: null, created_at: "", updated_at: "" },
  { id: "a1b2c3d4-e5f6-7890-abcd-100000000009", name: "Internal Ops & Infrastructure", slug: "internal-ops", type: "project", color: "#64748B", icon: "Settings", sort_order: 9, is_active: true, description: null, created_at: "", updated_at: "" },
];

interface CreateProjectModalProps {
  userRole: UserRole;
  userId?: string;
  trigger: React.ReactNode;
}

const STAGES: { value: ProjectStatus; label: string; description: string }[] = [
  { value: "Idea", label: "Idée", description: "Concept initial à explorer" },
  { value: "Validation", label: "Validation", description: "En cours de validation marché" },
  { value: "Scaling", label: "Scaling", description: "En phase de croissance" },
];

export function CreateProjectModal({
  userRole,
  userId,
  trigger,
}: CreateProjectModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const categories = mockCategories;

  // Form state
  const [title, setTitle] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stage, setStage] = useState<ProjectStatus>("Idea");
  const [visibility, setVisibility] = useState<ProjectVisibility>("Org");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [heroUrl, setHeroUrl] = useState("");

  // Reset form when modal closes
  const resetForm = () => {
    setTimeout(() => {
      setStep(1);
      setTitle("");
      setOneLiner("");
      setCategoryId("");
      setStage("Idea");
      setVisibility("Org");
      setTags([]);
      setTagInput("");
      setHeroUrl("");
    }, 300);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const canProceed = step === 1 ? title.trim().length >= 3 : categoryId !== "";

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createProject({
        title: title.trim(),
        description: oneLiner.trim() || null,
        category_id: categoryId || null,
        status: stage,
        visibility,
        tags,
        thumbnail_url: heroUrl.trim() || null,
      });

      if (result.success && result.slug) {
        toast.success("Projet créé avec succès !");
        handleOpenChange(false);
        router.push(`/lab/${result.slug}/edit`);
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectCategories = categories.filter((c) => c.type === "project");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg border-white/10 bg-neutral-900 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Nouvelle Opportunité
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Créez un nouveau projet pour l&apos;incubateur
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-violet-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Nom du projet <span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Supermedia AI Agent"
                className="border-white/10 bg-white/5 text-white placeholder:text-neutral-500"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oneLiner" className="text-white">
                Pitch en une ligne
              </Label>
              <Textarea
                id="oneLiner"
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                placeholder="Décrivez le projet en une phrase percutante..."
                className="min-h-[80px] resize-none border-white/10 bg-white/5 text-white placeholder:text-neutral-500"
                maxLength={200}
              />
              <p className="text-right text-xs text-neutral-500">
                {oneLiner.length}/200
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Category & Stage */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">
                Catégorie <span className="text-red-400">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-neutral-900">
                  {projectCategories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="text-white focus:bg-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color || "#888" }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Phase du projet</Label>
              <div className="grid grid-cols-3 gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStage(s.value)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      stage === s.value
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm font-medium text-white">{s.label}</div>
                    <div className="text-xs text-neutral-400">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Visibilité</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("Org")}
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
                    visibility === "Org"
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <Globe className="h-4 w-4 text-emerald-400" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">Organisation</div>
                    <div className="text-xs text-neutral-400">Visible par tous</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("Private")}
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
                    visibility === "Private"
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <Lock className="h-4 w-4 text-amber-400" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">Privé</div>
                    <div className="text-xs text-neutral-400">Accès restreint</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Optional Details */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Tags (optionnel)</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ajouter un tag..."
                  className="border-white/10 bg-white/5 text-white placeholder:text-neutral-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addTag}
                  disabled={tags.length >= 5}
                  className="border-white/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-neutral-500">{tags.length}/5 tags</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroUrl" className="text-white">
                Image de couverture (URL)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="heroUrl"
                  value={heroUrl}
                  onChange={(e) => setHeroUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="border-white/10 bg-white/5 text-white placeholder:text-neutral-500"
                />
              </div>
              {heroUrl && (
                <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10">
                  <img
                    src={heroUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80";
                    }}
                  />
                </div>
              )}
              {!heroUrl && (
                <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-neutral-500" />
                    <p className="mt-2 text-sm text-neutral-500">
                      Aperçu de l&apos;image
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h4 className="mb-2 text-sm font-medium text-white">Résumé</h4>
              <div className="space-y-1 text-sm text-neutral-400">
                <p>
                  <span className="text-neutral-500">Titre:</span> {title}
                </p>
                <p>
                  <span className="text-neutral-500">Catégorie:</span>{" "}
                  {projectCategories.find((c) => c.id === categoryId)?.name || "—"}
                </p>
                <p>
                  <span className="text-neutral-500">Phase:</span>{" "}
                  {STAGES.find((s) => s.value === stage)?.label}
                </p>
                <p>
                  <span className="text-neutral-500">Visibilité:</span>{" "}
                  {visibility === "Org" ? "Organisation" : "Privé"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          {step > 1 ? (
            <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
              Retour
            </Button>
          ) : (
            <div />
          )}

          <Button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : step < 3 ? (
              "Suivant"
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Créer le projet
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
