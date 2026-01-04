"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Target,
  DollarSign,
  Users,
  Briefcase,
  Scale,
  Handshake,
  HelpCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fulfillNeed,
  rejectNeed,
  setNeedInReview,
} from "@/lib/actions/needs";
import type { NeedWithProject } from "@/lib/data/needs";
import type { NeedStatus, NeedType } from "@/types";

interface NeedsContentProps {
  needs: NeedWithProject[];
}

const STATUS_OPTIONS: { value: NeedStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "Open", label: "Ouvert" },
  { value: "InReview", label: "En revue" },
  { value: "Fulfilled", label: "Réalisé" },
  { value: "Rejected", label: "Rejeté" },
];

const TYPE_OPTIONS: { value: NeedType | "all"; label: string; icon: typeof DollarSign }[] = [
  { value: "all", label: "Tous les types", icon: Target },
  { value: "Budget", label: "Budget", icon: DollarSign },
  { value: "Hiring", label: "Recrutement", icon: Users },
  { value: "Intro", label: "Introduction", icon: Handshake },
  { value: "Supplier", label: "Fournisseur", icon: Briefcase },
  { value: "Legal", label: "Juridique", icon: Scale },
  { value: "Other", label: "Autre", icon: HelpCircle },
];

const URGENCY_OPTIONS = [
  { value: "all", label: "Toutes urgences" },
  { value: 5, label: "Très haute (5)" },
  { value: 4, label: "Haute (4+)" },
  { value: 3, label: "Moyenne (3+)" },
];

const statusConfig: Record<
  NeedStatus,
  { icon: typeof Clock; label: string; className: string }
> = {
  Open: {
    icon: Clock,
    label: "Ouvert",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  InReview: {
    icon: AlertTriangle,
    label: "En revue",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  Fulfilled: {
    icon: CheckCircle2,
    label: "Réalisé",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  Rejected: {
    icon: XCircle,
    label: "Rejeté",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

const typeConfig: Record<NeedType, { icon: typeof DollarSign; color: string }> = {
  Budget: { icon: DollarSign, color: "text-emerald-400" },
  Hiring: { icon: Users, color: "text-blue-400" },
  Intro: { icon: Handshake, color: "text-purple-400" },
  Supplier: { icon: Briefcase, color: "text-orange-400" },
  Legal: { icon: Scale, color: "text-rose-400" },
  Other: { icon: HelpCircle, color: "text-neutral-400" },
};

function StatusBadge({ status }: { status: NeedStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: number }) {
  const config = {
    5: { label: "Très haute", className: "bg-rose-500/20 text-rose-400" },
    4: { label: "Haute", className: "bg-amber-500/20 text-amber-400" },
    3: { label: "Moyenne", className: "bg-blue-500/20 text-blue-400" },
    2: { label: "Faible", className: "bg-neutral-500/20 text-neutral-400" },
    1: { label: "Très faible", className: "bg-neutral-500/20 text-neutral-500" },
  }[urgency] || { label: "—", className: "bg-neutral-500/20 text-neutral-500" };

  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[10px] font-semibold",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function NeedCard({ need }: { need: NeedWithProject }) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(need.status);

  const TypeIcon = typeConfig[need.type]?.icon || HelpCircle;
  const typeColor = typeConfig[need.type]?.color || "text-neutral-400";

  const handleFulfill = () => {
    startTransition(async () => {
      const result = await fulfillNeed(need.id);
      if (result.success) {
        setLocalStatus("Fulfilled");
        toast.success("Besoin satisfait !");
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectNeed(need.id);
      if (result.success) {
        setLocalStatus("Rejected");
        toast.success("Besoin rejeté");
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  const handleInReview = () => {
    startTransition(async () => {
      const result = await setNeedInReview(need.id);
      if (result.success) {
        setLocalStatus("InReview");
        toast.success("Besoin en cours de revue");
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  const isActionable = localStatus === "Open" || localStatus === "InReview";

  return (
    <article
      className={cn(
        "group rounded-2xl",
        "bg-neutral-900/50 backdrop-blur-sm",
        "border border-white/5",
        "p-5",
        "transition-all duration-300",
        "hover:bg-neutral-900/80 hover:border-white/10",
        !isActionable && "opacity-60"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-2">
          {/* Top row: Type, Status, Urgency */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("flex items-center gap-1.5", typeColor)}>
              <TypeIcon className="h-4 w-4" />
              <span className="text-xs font-medium">
                {TYPE_OPTIONS.find((t) => t.value === need.type)?.label}
              </span>
            </div>
            <StatusBadge status={localStatus} />
            <UrgencyBadge urgency={need.urgency} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white">{need.title}</h3>

          {/* Description */}
          {need.description && (
            <p className="text-sm text-neutral-400 line-clamp-2">
              {need.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            {need.projects && (
              <Link
                href={`/showroom/${need.projects.slug}`}
                className="flex items-center gap-1 hover:text-violet-400 transition-colors"
              >
                {need.projects.title}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            {need.deadline && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Échéance: {new Date(need.deadline).toLocaleDateString("fr-FR")}
              </span>
            )}
            <span>
              Créé le {new Date(need.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Actions */}
        {isActionable && (
          <div className="flex shrink-0 gap-2">
            {localStatus === "Open" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleInReview}
                disabled={isPending}
                className="border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="mr-1.5 h-4 w-4" />
                    En revue
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isPending}
              className="border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Rejeter
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleFulfill}
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Satisfaire
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

export function NeedsContent({ needs }: NeedsContentProps) {
  const [statusFilter, setStatusFilter] = useState<NeedStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<NeedType | "all">("all");
  const [urgencyFilter, setUrgencyFilter] = useState<number | "all">("all");

  const filteredNeeds = useMemo(() => {
    return needs.filter((n) => {
      if (statusFilter !== "all" && n.status !== statusFilter) return false;
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (urgencyFilter !== "all" && n.urgency < urgencyFilter) return false;
      return true;
    });
  }, [needs, statusFilter, typeFilter, urgencyFilter]);

  const openCount = needs.filter(
    (n) => n.status === "Open" || n.status === "InReview"
  ).length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as NeedStatus | "all")}
        >
          <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-neutral-900">
            {STATUS_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-white focus:bg-white/10"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as NeedType | "all")}
        >
          <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-neutral-900">
            {TYPE_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-white focus:bg-white/10"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(urgencyFilter)}
          onValueChange={(v) =>
            setUrgencyFilter(v === "all" ? "all" : parseInt(v))
          }
        >
          <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Urgence" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-neutral-900">
            {URGENCY_OPTIONS.map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
                className="text-white focus:bg-white/10"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stats */}
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span className="font-medium text-blue-400">{openCount}</span>
          <span>ouvert{openCount !== 1 ? "s" : ""}</span>
          <span className="mx-2">•</span>
          <span>{filteredNeeds.length} affiché{filteredNeeds.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* List */}
      {filteredNeeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-700 py-16">
          <Target className="h-12 w-12 text-blue-600" />
          <p className="mt-4 text-lg font-medium text-neutral-400">
            Aucun besoin trouvé
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Essayez de modifier vos filtres
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNeeds.map((need) => (
            <NeedCard key={need.id} need={need} />
          ))}
        </div>
      )}
    </div>
  );
}

