"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Folder,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  XCircle,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

interface LabWorkspaceProps {
  projects: Project[];
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  Idea: {
    label: "Idée",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
  },
  Validation: {
    label: "Validation",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  Scaling: {
    label: "Scaling",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
  },
  Stalled: {
    label: "En pause",
    color: "text-red-400",
    bg: "bg-red-500/10",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  Supported: {
    label: "Soutenu",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
};

function ProjectListItem({
  project,
  isSelected,
  onClick,
}: {
  project: Project;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = statusConfig[project.status];
  const lastUpdate = new Date(project.last_updated_at || project.updated_at);
  const daysSinceUpdate = Math.floor(
    (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isStale = daysSinceUpdate > 14;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-all",
        isSelected
          ? "border-violet-500/50 bg-violet-500/10"
          : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-white">
            {project.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {project.description || "Pas de description"}
          </p>
        </div>
        {isStale && (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn("text-[10px]", config.bg, config.color, "border-0")}
        >
          {config.icon}
          <span className="ml-1">{config.label}</span>
        </Badge>
        <span className="text-[10px] text-neutral-600">
          <Clock className="mr-1 inline h-3 w-3" />
          {daysSinceUpdate === 0
            ? "Aujourd'hui"
            : daysSinceUpdate === 1
            ? "Hier"
            : `${daysSinceUpdate}j`}
        </span>
      </div>
    </button>
  );
}

function EmptySelection() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
        <Folder className="h-8 w-8 text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">
        Sélectionnez un projet
      </h3>
      <p className="mt-1 text-center text-sm text-neutral-500">
        Choisissez un projet dans la liste pour
        <br />
        accéder à son espace de travail
      </p>
    </div>
  );
}

function ProjectWorkspace({ project }: { project: Project }) {
  const config = statusConfig[project.status];

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.02]">
      {/* Project Header */}
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
              <Folder className="h-6 w-6 text-violet-400" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-white">{project.title}</h2>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-xs", config.bg, config.color, "border-0")}
              >
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
              {project.the_ask && (
                <span className="text-xs text-emerald-400">• {project.the_ask}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="border-white/10">
            <Link href={`/showroom/${project.slug}`}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Showroom
            </Link>
          </Button>
          <Button size="sm" asChild className="bg-violet-600 hover:bg-violet-700">
            <Link href={`/lab/${project.slug}/edit`}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Éditer
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 border-b border-white/5 p-4">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-neutral-500">Milestones</p>
          <p className="mt-1 text-xl font-bold text-white">0</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-neutral-500">Tâches</p>
          <p className="mt-1 text-xl font-bold text-white">0</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-neutral-500">Décisions</p>
          <p className="mt-1 text-xl font-bold text-white">0</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs text-neutral-500">Besoins</p>
          <p className="mt-1 text-xl font-bold text-white">0</p>
        </div>
      </div>

      {/* Description / Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-neutral-400">Description</h4>
            <p className="text-sm text-white">
              {project.description || "Aucune description pour ce projet."}
            </p>
          </div>

          {project.highlights && project.highlights.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-neutral-400">Points clés</h4>
              <ul className="space-y-1">
                {project.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.tags && project.tags.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-neutral-400">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-white/5 text-neutral-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-white/5 p-4">
        <Button asChild className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
          <Link href={`/lab/${project.slug}/edit`}>
            <Edit3 className="mr-2 h-4 w-4" />
            Ouvrir l&apos;éditeur complet
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function LabWorkspace({ projects }: LabWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const lower = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower) ||
        p.tags?.some((t) => t.toLowerCase().includes(lower))
    );
  }, [projects, search]);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  return (
    <div className="flex h-[calc(100vh-14rem)] gap-4">
      {/* Left: Project List */}
      <div className="flex w-80 shrink-0 flex-col">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un projet..."
            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Project List */}
        <ScrollArea className="flex-1 rounded-lg border border-white/5 bg-white/[0.01]">
          <div className="space-y-2 p-2">
            {filteredProjects.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-500">
                Aucun projet trouvé
              </div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  isSelected={selectedProjectId === project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* List Footer */}
        <p className="mt-2 text-center text-xs text-neutral-600">
          {filteredProjects.length} projet{filteredProjects.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Right: Workspace */}
      <div className="flex-1">
        {selectedProject ? (
          <ProjectWorkspace project={selectedProject} />
        ) : (
          <EmptySelection />
        )}
      </div>
    </div>
  );
}

