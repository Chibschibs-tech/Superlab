import { Suspense } from "react";
import { CircleCheckBig, Clock, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDecisions } from "@/lib/data/decisions";
import { cn } from "@/lib/utils";
import type { Decision } from "@/types";

interface DecisionWithProject extends Decision {
  projects?: {
    title: string;
    slug: string;
  };
}

function DecisionsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-2xl bg-neutral-800/50"
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: DecisionWithProject["status"] }) {
  const config = {
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

  const { icon: Icon, label, className } = config[status as keyof typeof config];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

async function DecisionsList() {
  const decisions = await getDecisions();
  const pendingDecisions = decisions.filter((d) => d.status === "Pending");

  if (pendingDecisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-700 py-16">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <p className="mt-4 text-lg font-medium text-neutral-400">
          Aucune décision en attente
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Toutes les demandes ont été traitées
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingDecisions.map((decision) => (
        <article
          key={decision.id}
          className={cn(
            "group rounded-2xl",
            "bg-neutral-900/50 backdrop-blur-sm",
            "border border-white/5",
            "p-6",
            "transition-all duration-300",
            "hover:bg-neutral-900/80 hover:border-white/10"
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <StatusBadge status={decision.status} />
              <h3 className="text-lg font-semibold text-white">
                {decision.question}
              </h3>
              {decision.projects && (
                <p className="text-sm text-neutral-500">
                  Projet : {decision.projects.title}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                Refuser
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Approuver
              </Button>
            </div>
          </div>

          {/* Options */}
          {decision.options && decision.options.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {decision.options.map((option, idx) => (
                <span
                  key={idx}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-neutral-300"
                >
                  {option}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export default function DecisionsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-white/10">
            <CircleCheckBig className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Décisions
            </h1>
            <p className="text-sm text-neutral-400">
              Demandes d&apos;approbation et ressources
            </p>
          </div>
        </div>
      </div>

      {/* Decision Cards */}
      <Suspense fallback={<DecisionsSkeleton />}>
        <DecisionsList />
      </Suspense>
    </div>
  );
}
