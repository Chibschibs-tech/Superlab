"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  CircleDot,
  Target,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, Category } from "@/types";

// Executive signals for the card
interface ExecutiveSignals {
  pendingDecisions?: number;
  openNeeds?: number;
  nextMilestone?: { title: string; dueDate: string } | null;
  ownerAvatar?: string | null;
  ownerName?: string | null;
}

interface ProjectCardProps {
  project: Project;
  category?: Category | null;
  signals?: ExecutiveSignals;
}

const statusConfig: Record<
  Project["status"],
  { label: string; color: string; bg: string; glow: string }
> = {
  Idea: {
    label: "Idée",
    color: "text-violet-300",
    bg: "bg-violet-500/20 border-violet-400/30",
    glow: "shadow-violet-500/20",
  },
  Validation: {
    label: "Validation",
    color: "text-blue-300",
    bg: "bg-blue-500/20 border-blue-400/30",
    glow: "shadow-blue-500/20",
  },
  Scaling: {
    label: "Scaling",
    color: "text-emerald-300",
    bg: "bg-emerald-500/20 border-emerald-400/30",
    glow: "shadow-emerald-500/20",
  },
  Stalled: {
    label: "En pause",
    color: "text-rose-300",
    bg: "bg-rose-500/20 border-rose-400/30",
    glow: "shadow-rose-500/20",
  },
  Supported: {
    label: "Soutenu",
    color: "text-emerald-300",
    bg: "bg-emerald-500/20 border-emerald-400/30",
    glow: "shadow-emerald-500/20",
  },
};

function formatDaysUntil(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "En retard";
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays <= 7) return `${diffDays}j`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} sem`;
  return `${Math.ceil(diffDays / 30)} mois`;
}

function isRecentlyUpdated(lastUpdated: string): boolean {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const hoursDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= 48;
}

function isStale(lastUpdated: string): boolean {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > 14;
}

function PulseIndicator() {
  return (
    <div className="absolute right-3 top-3 z-20" aria-label="Mis à jour récemment">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
      </span>
    </div>
  );
}

function StaleIndicator() {
  return (
    <div 
      className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-2 py-1 backdrop-blur-sm border border-rose-500/30"
      aria-label="Projet en retard"
    >
      <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
      <span className="text-xs font-medium text-rose-300">En retard</span>
    </div>
  );
}

export function ProjectCard({ project, category, signals }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const status = statusConfig[project.status];
  const hasRecentUpdate = isRecentlyUpdated(project.last_updated_at);
  const isProjectStale = isStale(project.last_updated_at);
  const placeholderImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";

  // Executive signals
  const hasPendingDecisions = signals?.pendingDecisions && signals.pendingDecisions > 0;
  const hasOpenNeeds = signals?.openNeeds && signals.openNeeds > 0;
  const hasNextMilestone = signals?.nextMilestone;

  return (
    <Link
      href={`/showroom/${project.slug}`}
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`Voir le projet ${project.title}`}
    >
      <article
        className={cn(
          "relative aspect-[16/10] overflow-hidden rounded-2xl",
          "bg-neutral-900",
          "ring-1 ring-white/10",
          "transition-all duration-500 ease-out",
          "shadow-xl shadow-black/30",
          "group-hover:ring-white/25",
          "group-hover:shadow-2xl group-hover:shadow-black/50",
          "group-hover:scale-105"
        )}
      >
        {/* Full-Bleed Background Image */}
        <div className="absolute inset-0">
          <Image
            src={project.thumbnail_url || placeholderImage}
            alt=""
            fill
            className={cn(
              "object-cover transition-all duration-700 ease-out",
              "group-hover:scale-110"
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
          
          {/* Dark Gradient Overlays for Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-transparent" />
        </div>

        {/* Top-Right Indicators */}
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          {/* Owner Avatar */}
          {signals?.ownerAvatar && (
            <div
              className="h-7 w-7 overflow-hidden rounded-full border-2 border-white/20 bg-neutral-800"
              title={signals.ownerName || "Owner"}
            >
              <Image
                src={signals.ownerAvatar}
                alt={signals.ownerName || "Owner"}
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {!signals?.ownerAvatar && signals?.ownerName && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/20 bg-neutral-800 text-xs font-medium text-white"
              title={signals.ownerName}
            >
              {signals.ownerName.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Pulse Indicator (Recent Update) */}
          {hasRecentUpdate && !isProjectStale && (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            </span>
          )}
        </div>
        
        {/* Top-Left Indicators */}
        <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5">
          {/* Category Badge */}
          {category && (
            <div
              className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-semibold backdrop-blur-sm"
              style={{
                backgroundColor: `${category.color}20`,
                borderColor: `${category.color}40`,
                color: category.color || "#fff",
              }}
            >
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: category.color || "#fff" }}
              />
              {category.name}
            </div>
          )}
          
          {/* Stale Indicator (>14 days) */}
          {isProjectStale && (
            <div
              className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-2 py-1 backdrop-blur-sm border border-rose-500/30"
              aria-label="Projet en retard"
            >
              <AlertTriangle className="h-3 w-3 text-rose-400" />
              <span className="text-[10px] font-medium text-rose-300">En retard</span>
            </div>
          )}
        </div>

        {/* Glassmorphism Content Panel */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10",
            "transition-all duration-500 ease-out"
          )}
        >
          {/* Main Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3
                  className={cn(
                    "truncate text-lg font-bold tracking-tight text-white",
                    "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  )}
                >
                  {project.title}
                </h3>
                {project.description && (
                  <p
                    className={cn(
                      "mt-1 line-clamp-1 text-sm text-white/70",
                      "drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
                      "transition-all duration-300"
                    )}
                  >
                    {project.description}
                  </p>
                )}
              </div>
              
              {/* Status Badge */}
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1",
                  "text-xs font-semibold",
                  "backdrop-blur-md",
                  "shadow-lg",
                  status.bg,
                  status.color,
                  status.glow
                )}
              >
                {status.label}
              </span>
            </div>

            {/* Executive Signals Row */}
            {(hasPendingDecisions || hasOpenNeeds || hasNextMilestone) && (
              <div className="mt-2 flex items-center gap-3 text-[10px]">
                {hasPendingDecisions && (
                  <div className="flex items-center gap-1 text-amber-400">
                    <CircleDot className="h-3 w-3" />
                    <span>{signals?.pendingDecisions} décision{signals?.pendingDecisions !== 1 ? "s" : ""}</span>
                  </div>
                )}
                {hasOpenNeeds && (
                  <div className="flex items-center gap-1 text-blue-400">
                    <Target className="h-3 w-3" />
                    <span>{signals?.openNeeds} besoin{signals?.openNeeds !== 1 ? "s" : ""}</span>
                  </div>
                )}
                {hasNextMilestone && (
                  <div className="flex items-center gap-1 text-purple-400">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDaysUntil(signals?.nextMilestone?.dueDate || "")}</span>
                  </div>
                )}
              </div>
            )}

            {/* The Ask - Glassmorphism Overlay on Hover */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-500 ease-out",
                isHovered ? "mt-3 max-h-32 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {project.the_ask && (
                <div
                  className={cn(
                    "rounded-xl",
                    "bg-white/[0.08] backdrop-blur-xl",
                    "border border-white/[0.12]",
                    "px-4 py-3",
                    "shadow-lg"
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                    La demande
                  </p>
                  <p className="mt-1.5 text-sm font-medium leading-snug text-white">
                    {project.the_ask}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shine Effect on Hover */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-20",
            "bg-gradient-to-tr from-transparent via-white/10 to-transparent",
            "translate-x-[-100%] transition-transform duration-1000 ease-out",
            "group-hover:translate-x-[100%]"
          )}
        />
        
        {/* Border Glow on Hover */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 rounded-2xl",
            "opacity-0 transition-opacity duration-500",
            "ring-2 ring-inset",
            "group-hover:opacity-100",
            project.status === "Scaling" && "ring-emerald-500/30",
            project.status === "Validation" && "ring-blue-500/30",
            project.status === "Idea" && "ring-violet-500/30",
            project.status === "Stalled" && "ring-rose-500/30"
          )}
        />
      </article>
    </Link>
  );
}
