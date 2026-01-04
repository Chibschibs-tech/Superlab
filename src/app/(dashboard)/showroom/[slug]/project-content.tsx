"use client";

import { useState, useTransition } from "react";
import {
  Play,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Users,
  Calendar,
  Sparkles,
  GitBranch,
  FileText,
  MessageSquare,
  AlertTriangle,
  Code,
  Milestone,
  ScrollText,
  Zap,
  DollarSign,
  ThumbsUp,
  Lightbulb,
  Rocket,
  FolderOpen,
  Loader2,
  PartyPopper,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useViewMode } from "@/contexts/view-mode-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { approveProject } from "@/lib/actions/projects";
import type { Project } from "@/types";

interface ProjectContentProps {
  project: Project;
}

// Confetti celebration effect
function triggerCelebration() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Shoot from left
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ["#10b981", "#14b8a6", "#22c55e", "#fbbf24", "#f59e0b"],
    });

    // Shoot from right
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ["#10b981", "#14b8a6", "#22c55e", "#fbbf24", "#f59e0b"],
    });
  }, 250);

  // Big center burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#10b981", "#14b8a6", "#22c55e", "#fbbf24", "#f59e0b"],
    zIndex: 9999,
  });
}

const statusConfig: Record<
  Project["status"],
  { label: string; color: string; bg: string; textColor: string; icon: typeof TrendingUp }
> = {
  Idea: {
    label: "Idée",
    color: "text-violet-400",
    textColor: "text-violet-300",
    bg: "bg-violet-500/20 border-violet-500/30",
    icon: Sparkles,
  },
  Validation: {
    label: "Validation",
    color: "text-blue-400",
    textColor: "text-blue-300",
    bg: "bg-blue-500/20 border-blue-500/30",
    icon: Target,
  },
  Scaling: {
    label: "Scaling",
    color: "text-emerald-400",
    textColor: "text-emerald-300",
    bg: "bg-emerald-500/20 border-emerald-500/30",
    icon: TrendingUp,
  },
  Stalled: {
    label: "En pause",
    color: "text-rose-400",
    textColor: "text-rose-300",
    bg: "bg-rose-500/20 border-rose-500/30",
    icon: Clock,
  },
  Supported: {
    label: "Soutenu ✓",
    color: "text-emerald-300",
    textColor: "text-emerald-200",
    bg: "bg-emerald-500/30 border-emerald-400/40",
    icon: Heart,
  },
};

// ============================================
// CINEMATIC HERO
// ============================================

function CinematicHero({ project }: { project: Project }) {
  const StatusIcon = statusConfig[project.status].icon;

  return (
    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl bg-neutral-900">
      {/* Background Image */}
      {project.thumbnail_url && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${project.thumbnail_url})` }}
        />
      )}
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      
      {/* Letterbox Bars for cinematic feel */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black to-transparent" />

      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          className={cn(
            "group flex h-24 w-24 items-center justify-center rounded-full",
            "bg-white/10 backdrop-blur-xl",
            "border-2 border-white/30",
            "transition-all duration-500",
            "hover:scale-110 hover:bg-white/20 hover:border-white/50",
            "shadow-2xl shadow-black/50"
          )}
          aria-label="Lire la vidéo pitch"
        >
          <Play className="h-10 w-10 text-white ml-1 transition-transform group-hover:scale-110" fill="white" />
        </button>
      </div>

      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="flex items-end justify-between">
          <div>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold",
                "backdrop-blur-md",
                statusConfig[project.status].bg,
                statusConfig[project.status].color
              )}
            >
              <StatusIcon className="h-4 w-4" />
              {statusConfig[project.status].label}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl drop-shadow-2xl">
              {project.title}
            </h1>
          </div>
          {!project.pitch_video_url && (
            <div className="flex items-center gap-2 rounded-xl bg-black/60 px-4 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              <span className="text-sm text-white/70">Vidéo pitch à venir</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// OWNER MODE - THE VISION
// ============================================

function OwnerVisionSection({ project }: { project: Project }) {
  return (
    <div className="space-y-8">
      {/* Two Column Layout: Problem & Value Prop */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* The Problem */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
              <Lightbulb className="h-5 w-5 text-rose-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Le Problème</h2>
          </div>
          <p className="text-neutral-300 leading-relaxed">
            Les entreprises perdent un temps précieux sur des tâches répétitives et des processus manuels qui pourraient être automatisés. Sans innovation, elles risquent de perdre leur avantage concurrentiel.
          </p>
        </div>

        {/* Value Proposition */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <Rocket className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">La Solution</h2>
          </div>
          <p className="text-neutral-300 leading-relaxed">
            {project.description}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="ROI Estimé" value="+240%" color="text-emerald-400" />
        <MetricCard icon={<Users className="h-5 w-5" />} label="Équipe" value="3 pers." color="text-blue-400" />
        <MetricCard icon={<Calendar className="h-5 w-5" />} label="Livraison" value="Q1 2026" color="text-amber-400" />
        <MetricCard icon={<Zap className="h-5 w-5" />} label="Impact" value="Élevé" color="text-violet-400" />
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={cn("rounded-xl p-4", "bg-white/[0.03] backdrop-blur-sm", "border border-white/5")}>
      <div className={cn("mb-2", color)}>{icon}</div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

// ============================================
// THE ASK CARD (High Contrast)
// ============================================

function TheAskCard({ project }: { project: Project }) {
  const [isPending, startTransition] = useTransition();
  const [isApproved, setIsApproved] = useState(project.status === "Supported");
  const StatusIcon = statusConfig[project.status].icon;

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveProject(project.id);

      if (result.success) {
        setIsApproved(true);
        triggerCelebration();
        
        toast.success("Projet Officiellement Soutenu ! 🎉", {
          description: `${project.title} a été approuvé avec succès. L'équipe projet a été notifiée.`,
          duration: 5000,
          icon: <PartyPopper className="h-5 w-5 text-emerald-400" />,
        });
      } else {
        toast.error("Erreur lors de l'approbation", {
          description: result.error || "Une erreur inattendue s'est produite",
          duration: 4000,
        });
      }
    });
  };

  // If already approved, show success state
  if (isApproved || project.status === "Supported") {
    return (
      <div
        className={cn(
          "rounded-3xl overflow-hidden",
          "bg-gradient-to-br from-emerald-950/50 via-neutral-900 to-neutral-950",
          "border border-emerald-500/30",
          "sticky top-8"
        )}
      >
        {/* Success Header */}
        <div className="border-b border-emerald-500/30 bg-emerald-500/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold text-emerald-300">Projet Soutenu</span>
            </div>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                "bg-emerald-500/30 border-emerald-400/40 text-emerald-300"
              )}
            >
              <Heart className="h-3 w-3" />
              Soutenu ✓
            </span>
          </div>
        </div>

        {/* Success Content */}
        <div className="p-6 space-y-6">
          <div className="text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
              <PartyPopper className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Félicitations !</h3>
            <p className="text-neutral-400 text-sm">
              Ce projet a été officiellement approuvé et soutenu par la direction.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">
              Ressources Allouées
            </p>
            <p className="text-lg font-semibold text-emerald-300">
              {project.the_ask || "Ressources standard"}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            size="lg"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Contacter l&apos;équipe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-3xl overflow-hidden",
        "bg-gradient-to-br from-amber-950/50 via-neutral-900 to-neutral-950",
        "border border-amber-500/20",
        "sticky top-8"
      )}
    >
      {/* Header with Status */}
      <div className="border-b border-amber-500/20 bg-amber-500/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <span className="font-semibold text-amber-300">Approbation Requise</span>
          </div>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              statusConfig[project.status].bg,
              statusConfig[project.status].color
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig[project.status].label}
          </span>
        </div>
      </div>

      {/* The Ask Content */}
      <div className="p-6 space-y-6">
        {/* Request Amount */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">
            La Demande
          </p>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
              <DollarSign className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-tight">
                {project.the_ask || "Aucune demande"}
              </p>
              <p className="text-sm text-neutral-400 mt-1">Budget & Ressources</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/[0.03] p-3 text-center">
            <p className="text-2xl font-bold text-white">85%</p>
            <p className="text-xs text-neutral-500">Progression</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3 text-center">
            <p className="text-2xl font-bold text-white">12j</p>
            <p className="text-xs text-neutral-500">Avant deadline</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={handleApprove}
            disabled={isPending}
            className={cn(
              "w-full h-14 text-lg font-semibold",
              "bg-gradient-to-r from-emerald-500 to-teal-500",
              "hover:from-emerald-400 hover:to-teal-400",
              "text-white",
              "shadow-xl shadow-emerald-500/30",
              "transition-all duration-300 hover:scale-[1.02]",
              "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Approbation en cours...
              </>
            ) : (
              <>
                <ThumbsUp className="mr-2 h-6 w-6" />
                Approuver & Soutenir
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
            size="lg"
            disabled={isPending}
          >
            Demander plus d&apos;informations
          </Button>
        </div>

        <p className="text-center text-xs text-neutral-500">
          Une notification sera envoyée à l&apos;équipe projet
        </p>
      </div>
    </div>
  );
}

// ============================================
// LAB MODE COMPONENTS
// ============================================

function LabTechnicalSection({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
          <Target className="h-5 w-5 text-violet-400" />
          Résumé du Projet
        </h2>
        <p className="text-neutral-300 leading-relaxed">{project.description}</p>
      </div>

      {/* Development Roadmap */}
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-6">
          <Milestone className="h-5 w-5 text-cyan-400" />
          Roadmap de Développement
        </h2>
        <div className="space-y-1">
          <RoadmapItem status="completed" title="Phase 1: Discovery & MVP" date="Nov 2025" description="Recherche utilisateur, wireframes, et prototype fonctionnel" />
          <RoadmapItem status="completed" title="Phase 2: Alpha Testing" date="Dec 2025" description="Tests internes et itérations basées sur le feedback" />
          <RoadmapItem status="in-progress" title="Phase 3: Beta Privée" date="Jan 2026" description="Déploiement pour utilisateurs pilotes sélectionnés" />
          <RoadmapItem status="pending" title="Phase 4: Launch Public" date="Mar 2026" description="Release officielle et onboarding à grande échelle" />
        </div>
      </div>

      {/* Tech Stack */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
          <Code className="h-5 w-5 text-violet-400" />
          Stack Technique
        </h2>
        <div className="flex flex-wrap gap-2">
          {["Next.js 14", "TypeScript", "Supabase", "OpenAI GPT-4", "Vercel Edge", "Tailwind CSS", "PostgreSQL", "Redis"].map((tech) => (
            <span
              key={tech}
              className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-sm text-violet-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Technical Files */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
          <FolderOpen className="h-5 w-5 text-amber-400" />
          Fichiers Techniques
        </h2>
        <div className="space-y-2">
          <FileItem name="Architecture_Diagram_v2.pdf" size="2.4 MB" type="PDF" />
          <FileItem name="API_Documentation.md" size="156 KB" type="Markdown" />
          <FileItem name="Database_Schema.sql" size="12 KB" type="SQL" />
          <FileItem name="Security_Audit_Report.pdf" size="890 KB" type="PDF" />
        </div>
      </div>

      {/* Developer Notes */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
          <FileText className="h-5 w-5 text-amber-400" />
          Notes de l&apos;Équipe
        </h2>
        <div className="space-y-3">
          <DevNote author="Marie L." date="Il y a 2h" content="Optimisation des requêtes API terminée. Temps de réponse réduit de 40%." type="success" />
          <DevNote author="Thomas M." date="Hier" content="⚠️ Le rate limit OpenAI peut poser problème en pic de charge. Prévoir cache Redis." type="warning" />
          <DevNote author="Alexandre D." date="Il y a 3j" content="Documentation API mise à jour sur Notion. Prête pour review." type="info" />
        </div>
      </div>
    </div>
  );
}

function FileItem({ name, size, type }: { name: string; size: string; type: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
          <FileText className="h-5 w-5 text-neutral-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-neutral-500">{type} • {size}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
        Ouvrir
      </Button>
    </div>
  );
}

function RoadmapItem({
  status,
  title,
  date,
  description,
}: {
  status: "completed" | "in-progress" | "pending";
  title: string;
  date: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border-2",
            status === "completed" && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
            status === "in-progress" && "bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse",
            status === "pending" && "bg-neutral-800 border-neutral-600 text-neutral-500"
          )}
        >
          {status === "completed" && <CheckCircle2 className="h-5 w-5" />}
          {status === "in-progress" && <Clock className="h-5 w-5" />}
          {status === "pending" && <div className="h-2 w-2 rounded-full bg-neutral-600" />}
        </div>
        <div className="mt-2 h-full w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
      <div className="pb-8 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h4 className="font-semibold text-white">{title}</h4>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            status === "completed" && "bg-emerald-500/20 text-emerald-400",
            status === "in-progress" && "bg-cyan-500/20 text-cyan-400",
            status === "pending" && "bg-neutral-700 text-neutral-400"
          )}>
            {date}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-400">{description}</p>
      </div>
    </div>
  );
}

function DevNote({ author, date, content, type }: { author: string; date: string; content: string; type: "success" | "warning" | "info" }) {
  return (
    <div className={cn(
      "rounded-xl p-4 border",
      type === "success" && "bg-emerald-500/5 border-emerald-500/20",
      type === "warning" && "bg-amber-500/5 border-amber-500/20",
      type === "info" && "bg-blue-500/5 border-blue-500/20"
    )}>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span className="font-medium text-neutral-300">{author}</span>
        <span>•</span>
        <span>{date}</span>
      </div>
      <p className="mt-2 text-sm text-neutral-300">{content}</p>
    </div>
  );
}

function LabActivityPanel({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      {/* Activity Log */}
      <div className={cn("rounded-2xl p-6", "bg-gradient-to-br from-cyan-950/30 to-neutral-900", "border border-cyan-500/20")}>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <ScrollText className="h-5 w-5 text-cyan-400" />
          Journal d&apos;Activité
        </h3>
        <div className="mt-4 space-y-3">
          <ActivityItem type="milestone" content="Déploiement v2.1 en production" time="Il y a 6h" />
          <ActivityItem type="comment" content="Review code PR #142 terminée" time="Il y a 1j" />
          <ActivityItem type="blocker" content="Bug critique identifié sur auth" time="Il y a 2j" />
          <ActivityItem type="milestone" content="Sprint 12 terminé avec succès" time="Il y a 5j" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className={cn("rounded-2xl p-6", "bg-white/[0.02]", "border border-white/5")}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">
          Accès Rapides
        </h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10">
            <GitBranch className="mr-2 h-4 w-4 text-violet-400" />
            Repository GitHub
          </Button>
          <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10">
            <FileText className="mr-2 h-4 w-4 text-blue-400" />
            Documentation Notion
          </Button>
          <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10">
            <MessageSquare className="mr-2 h-4 w-4 text-emerald-400" />
            Canal Slack #projet
          </Button>
        </div>
      </div>

      {/* Mini Ask Card */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
        <div className="flex items-center gap-2 text-sm text-amber-400 mb-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-semibold">Demande en cours</span>
        </div>
        <p className="text-sm text-neutral-300">{project.the_ask || "Aucune demande"}</p>
      </div>
    </div>
  );
}

function ActivityItem({
  type,
  content,
  time,
}: {
  type: "milestone" | "comment" | "blocker";
  content: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full",
          type === "milestone" && "bg-emerald-500/20 text-emerald-400",
          type === "comment" && "bg-blue-500/20 text-blue-400",
          type === "blocker" && "bg-rose-500/20 text-rose-400"
        )}
      >
        {type === "milestone" && <CheckCircle2 className="h-3.5 w-3.5" />}
        {type === "comment" && <MessageSquare className="h-3.5 w-3.5" />}
        {type === "blocker" && <AlertTriangle className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1">
        <p className="text-sm text-neutral-300">{content}</p>
        <p className="text-xs text-neutral-500">{time}</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ProjectContent({ project }: ProjectContentProps) {
  const { viewMode } = useViewMode();

  return (
    <div className="space-y-8">
      {/* Cinematic Hero - Always visible */}
      <CinematicHero project={project} />

      {/* Content based on View Mode */}
      {viewMode === "owner" ? (
        /* ============================================
           OWNER MODE: Clean, Pitch-focused
           ============================================ */
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OwnerVisionSection project={project} />
          </div>
          <div>
            <TheAskCard project={project} />
          </div>
        </div>
      ) : (
        /* ============================================
           LAB MODE: Technical, Developer-focused
           ============================================ */
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LabTechnicalSection project={project} />
          </div>
          <div>
            <LabActivityPanel project={project} />
          </div>
        </div>
      )}
    </div>
  );
}
