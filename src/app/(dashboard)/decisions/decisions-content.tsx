"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Loader2,
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
  approveDecision,
  rejectDecision,
  requestDecisionInfo,
} from "@/lib/actions/decisions";
import type { DecisionWithProject } from "@/lib/data/decisions";
import type { DecisionStatus } from "@/types";

interface DecisionsContentProps {
  decisions: DecisionWithProject[];
}

const STATUS_OPTIONS: { value: DecisionStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "Pending", label: "En attente" },
  { value: "InfoRequested", label: "Info demandée" },
  { value: "Approved", label: "Approuvé" },
  { value: "Rejected", label: "Refusé" },
];

const statusConfig: Record<
  DecisionStatus,
  { icon: typeof Clock; label: string; className: string }
> = {
  Pending: {
    icon: Clock,
    label: "En attente",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  Approved: {
    icon: CheckCircle2,
    label: "Approuvé",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  Rejected: {
    icon: XCircle,
    label: "Refusé",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  InfoRequested: {
    icon: HelpCircle,
    label: "Info demandée",
    className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
};

function StatusBadge({ status }: { status: DecisionStatus }) {
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

function DecisionCard({ decision }: { decision: DecisionWithProject }) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(decision.status);

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveDecision(decision.id);
      if (result.success) {
        setLocalStatus("Approved");
        toast.success("Décision approuvée !");
      } else {
        toast.error(result.error || "Erreur lors de l'approbation");
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectDecision(decision.id);
      if (result.success) {
        setLocalStatus("Rejected");
        toast.success("Décision refusée");
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  const handleRequestInfo = () => {
    startTransition(async () => {
      const result = await requestDecisionInfo(decision.id);
      if (result.success) {
        setLocalStatus("InfoRequested");
        toast.success("Demande d'informations envoyée");
      } else {
        toast.error(result.error || "Erreur");
      }
    });
  };

  const isPendingAction = localStatus === "Pending" || localStatus === "InfoRequested";

  return (
    <article
      className={cn(
        "group rounded-2xl",
        "bg-neutral-900/50 backdrop-blur-sm",
        "border border-white/5",
        "p-5",
        "transition-all duration-300",
        "hover:bg-neutral-900/80 hover:border-white/10",
        !isPendingAction && "opacity-60"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <StatusBadge status={localStatus} />
            {decision.projects && (
              <Link
                href={`/showroom/${decision.projects.slug}`}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-violet-400 transition-colors"
              >
                {decision.projects.title}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white">
            {decision.question}
          </h3>
          <p className="text-xs text-neutral-500">
            {new Date(decision.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Actions - Only show for pending decisions */}
        {isPendingAction && (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestInfo}
              disabled={isPending || localStatus === "InfoRequested"}
              className="border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <HelpCircle className="mr-1.5 h-4 w-4" />
                  Plus d&apos;infos
                </>
              )}
            </Button>
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
                  Refuser
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Approuver
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Options */}
      {decision.options && decision.options.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {decision.options.map((option, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="bg-white/5 text-neutral-300"
            >
              {option}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}

export function DecisionsContent({ decisions }: DecisionsContentProps) {
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | "all">("all");

  const filteredDecisions = decisions.filter((d) => {
    if (statusFilter === "all") return true;
    return d.status === statusFilter;
  });

  const pendingCount = decisions.filter(
    (d) => d.status === "Pending" || d.status === "InfoRequested"
  ).length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DecisionStatus | "all")}
        >
          <SelectTrigger className="w-[180px] border-white/10 bg-white/5 text-white">
            <Filter className="mr-2 h-4 w-4 text-neutral-500" />
            <SelectValue placeholder="Filtrer par statut" />
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

        {/* Stats */}
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span className="font-medium text-amber-400">{pendingCount}</span>
          <span>en attente</span>
          <span className="mx-2">•</span>
          <span>{filteredDecisions.length} affichée{filteredDecisions.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* List */}
      {filteredDecisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-700 py-16">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <p className="mt-4 text-lg font-medium text-neutral-400">
            {statusFilter === "all"
              ? "Aucune décision"
              : "Aucune décision avec ce statut"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {statusFilter === "all"
              ? "Les nouvelles demandes apparaîtront ici"
              : "Essayez un autre filtre"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDecisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      )}
    </div>
  );
}

