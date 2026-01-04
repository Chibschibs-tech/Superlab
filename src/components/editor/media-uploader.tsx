"use client";

import { useState, useTransition, useRef } from "react";
import {
  Upload,
  Image,
  FileText,
  Video,
  Code,
  Table,
  Pencil,
  File,
  Pin,
  PinOff,
  Trash2,
  X,
  Plus,
  Eye,
  EyeOff,
  Star,
  Tag,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createAsset, updateAsset, deleteAsset } from "@/lib/actions/editor";
import type { ProjectAsset, AssetType } from "@/types";

interface MediaUploaderProps {
  projectId: string;
  assets: ProjectAsset[];
}

const assetTypeConfig: Record<AssetType, { label: string; icon: typeof Image; color: string }> = {
  image: { label: "Image", icon: Image, color: "text-pink-400" },
  video: { label: "Vidéo", icon: Video, color: "text-red-400" },
  document: { label: "Document", icon: FileText, color: "text-blue-400" },
  design: { label: "Design", icon: Pencil, color: "text-violet-400" },
  code: { label: "Code", icon: Code, color: "text-emerald-400" },
  spreadsheet: { label: "Tableur", icon: Table, color: "text-green-400" },
  other: { label: "Autre", icon: File, color: "text-neutral-400" },
};

interface AssetFormData {
  name: string;
  description: string;
  type: AssetType;
  file_url: string;
  is_public: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  tags: string[];
}

const defaultFormData: AssetFormData = {
  name: "",
  description: "",
  type: "document",
  file_url: "",
  is_public: false,
  is_featured: false,
  is_pinned: false,
  tags: [],
};

export function MediaUploader({ projectId, assets }: MediaUploaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ProjectAsset | null>(null);
  const [formData, setFormData] = useState<AssetFormData>(defaultFormData);
  const [newTag, setNewTag] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pinnedAssets = assets.filter((a) => a.is_pinned);
  const unpinnedAssets = assets.filter((a) => !a.is_pinned);

  const openCreateDialog = () => {
    setEditingAsset(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (asset: ProjectAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description ?? "",
      type: asset.type,
      file_url: asset.file_url,
      is_public: asset.is_public,
      is_featured: asset.is_featured,
      is_pinned: asset.is_pinned,
      tags: asset.tags ?? [],
    });
    setIsDialogOpen(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.file_url.trim()) {
      toast.error("Nom et URL sont requis");
      return;
    }

    startTransition(async () => {
      if (editingAsset) {
        const result = await updateAsset(editingAsset.id, {
          name: formData.name,
          description: formData.description || null,
          is_public: formData.is_public,
          is_featured: formData.is_featured,
          is_pinned: formData.is_pinned,
          tags: formData.tags,
        });

        if (result.success) {
          toast.success("Fichier mis à jour");
          setIsDialogOpen(false);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createAsset({
          project_id: projectId,
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          file_url: formData.file_url,
          is_public: formData.is_public,
          is_featured: formData.is_featured,
          is_pinned: formData.is_pinned,
          tags: formData.tags,
        });

        if (result.success) {
          toast.success("Fichier ajouté");
          setIsDialogOpen(false);
        } else {
          toast.error(result.error);
        }
      }
    });
  };

  const handleDelete = (assetId: string) => {
    startTransition(async () => {
      const result = await deleteAsset(assetId);
      if (result.success) {
        toast.success("Fichier supprimé");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleTogglePin = (asset: ProjectAsset) => {
    startTransition(async () => {
      const result = await updateAsset(asset.id, { is_pinned: !asset.is_pinned });
      if (result.success) {
        toast.success(asset.is_pinned ? "Fichier désépinglé" : "Fichier épinglé");
      }
    });
  };

  return (
    <>
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-cyan-400" />
              Fichiers & Médias
            </CardTitle>
            <Button
              size="sm"
              onClick={openCreateDialog}
              className="h-8 bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pinned Assets */}
          {pinnedAssets.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                <Pin className="h-3.5 w-3.5" />
                Épinglés
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {pinnedAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={() => openEditDialog(asset)}
                    onDelete={() => handleDelete(asset.id)}
                    onTogglePin={() => handleTogglePin(asset)}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Assets */}
          {unpinnedAssets.length > 0 && (
            <div className="space-y-2">
              {pinnedAssets.length > 0 && (
                <div className="text-xs font-medium text-neutral-500">Tous les fichiers</div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {unpinnedAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={() => openEditDialog(asset)}
                    onDelete={() => handleDelete(asset.id)}
                    onTogglePin={() => handleTogglePin(asset)}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {assets.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <Upload className="mx-auto h-10 w-10 text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-400">Aucun fichier</p>
              <p className="text-xs text-neutral-500 mt-1">
                Ajoutez des documents, images ou vidéos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-neutral-900 border-white/10">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? "Modifier le fichier" : "Ajouter un fichier"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Architecture_v2.pdf"
                className="bg-white/[0.02] border-white/10"
              />
            </div>

            {!editingAsset && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as AssetType })}
                  >
                    <SelectTrigger className="bg-white/[0.02] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(assetTypeConfig).map(([key, config]) => (
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
                  <Label htmlFor="file_url">URL du fichier *</Label>
                  <Input
                    id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    placeholder="https://..."
                    className="bg-white/[0.02] border-white/10"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle..."
                className="bg-white/[0.02] border-white/10 min-h-[80px]"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-white/5 text-neutral-300 hover:bg-white/10"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 hover:text-rose-400"
                      aria-label={`Supprimer le tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Ajouter un tag..."
                  className="bg-white/[0.02] border-white/10"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                  className="border-white/10"
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Épingler</Label>
                  <p className="text-xs text-neutral-500">Afficher en premier</p>
                </div>
                <Switch
                  checked={formData.is_pinned}
                  onCheckedChange={(v) => setFormData({ ...formData, is_pinned: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public</Label>
                  <p className="text-xs text-neutral-500">Visible dans le Showroom</p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(v) => setFormData({ ...formData, is_public: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mis en avant</Label>
                  <p className="text-xs text-neutral-500">Afficher dans le Hero</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/10">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-cyan-600 hover:bg-cyan-500">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingAsset ? (
                "Mettre à jour"
              ) : (
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Asset Card Component
function AssetCard({
  asset,
  onEdit,
  onDelete,
  onTogglePin,
  isPending,
}: {
  asset: ProjectAsset;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  isPending: boolean;
}) {
  const config = assetTypeConfig[asset.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-3 transition-colors",
        asset.is_pinned
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-white/5 bg-white/[0.02] hover:border-white/10"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-lg p-2 bg-white/5", config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{asset.name}</p>
          {asset.description && (
            <p className="text-xs text-neutral-500 truncate">{asset.description}</p>
          )}
          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {asset.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-white/5 text-neutral-400"
                >
                  {tag}
                </span>
              ))}
              {asset.tags.length > 3 && (
                <span className="text-[10px] text-neutral-500">+{asset.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Status indicators */}
        <div className="flex items-center gap-1">
          {asset.is_public && <Eye className="h-3.5 w-3.5 text-emerald-400" />}
          {asset.is_featured && <Star className="h-3.5 w-3.5 text-amber-400" />}
        </div>
      </div>

      {/* Actions (shown on hover) */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePin}
          disabled={isPending}
          className="h-7 w-7 text-neutral-400 hover:text-amber-400"
          aria-label={asset.is_pinned ? "Désépingler" : "Épingler"}
        >
          {asset.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-7 w-7 text-neutral-400 hover:text-white"
          aria-label="Modifier"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-7 w-7 text-neutral-400 hover:text-cyan-400"
        >
          <a href={asset.file_url} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isPending}
          className="h-7 w-7 text-neutral-400 hover:text-rose-400"
          aria-label="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

