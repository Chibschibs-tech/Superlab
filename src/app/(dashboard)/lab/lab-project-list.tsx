"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Zap,
  Pause,
  Sparkles,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, ProjectStatus } from "@/types";

interface LabProjectListProps {
  projects: Project[];
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  Idea: {
    label: "Idée",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
  },
  Validation: {
    label: "Validation",
    icon: <Zap className="h-3.5 w-3.5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
  Scaling: {
    label: "Scaling",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
  Stalled: {
    label: "En pause",
    icon: <Pause className="h-3.5 w-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
  },
  Supported: {
    label: "Soutenu",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

function isStale(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 14;
}

export function LabProjectList({ projects }: LabProjectListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch =
        project.title.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.slug.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un projet..."
            className="border-white/10 bg-white/5 pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full border-white/10 bg-white/5 sm:w-40">
            <Filter className="mr-2 h-4 w-4 text-neutral-500" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span className={config.color}>{config.icon}</span>
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-700 py-16">
          <Search className="h-10 w-10 text-neutral-600" />
          <p className="mt-4 text-neutral-400">Aucun projet trouvé</p>
          <p className="mt-1 text-sm text-neutral-500">
            Modifiez vos filtres ou créez un nouveau projet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project) => {
            const config = STATUS_CONFIG[project.status];
            const stale = isStale(project.last_updated_at);

            return (
              <Link
                key={project.id}
                href={`/lab/${project.slug}/edit`}
                className="group block"
              >
                <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                  {/* Thumbnail */}
                  <div
                    className="h-14 w-20 shrink-0 rounded-lg bg-cover bg-center"
                    style={{
                      backgroundImage: project.thumbnail_url
                        ? `url(${project.thumbnail_url})`
                        : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    }}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-white group-hover:text-violet-300">
                        {project.title}
                      </h3>
                      {stale && (
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-neutral-400">
                      {project.description || "Aucune description"}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                      <Badge
                        variant="secondary"
                        className={`${config.bg} ${config.color} gap-1 border-0`}
                      >
                        {config.icon}
                        {config.label}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(project.last_updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 shrink-0 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Count */}
      <p className="text-center text-xs text-neutral-500">
        {filteredProjects.length} projet{filteredProjects.length !== 1 && "s"} trouvé
        {filteredProjects.length !== 1 && "s"}
      </p>
    </div>
  );
}

