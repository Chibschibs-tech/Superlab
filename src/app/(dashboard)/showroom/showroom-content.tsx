"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProjectCard } from "@/components/projects/project-card";
import type { Project, Category, ProjectStatus } from "@/types";

interface ShowroomContentProps {
  projects: Project[];
  categories: Category[];
}

const STATUS_OPTIONS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "Scaling", label: "Scaling" },
  { value: "Validation", label: "Validation" },
  { value: "Idea", label: "Idée" },
  { value: "Stalled", label: "En pause" },
  { value: "Supported", label: "Soutenu" },
];

const FRESHNESS_OPTIONS = [
  { value: "all", label: "Toute activité" },
  { value: "recent", label: "Actif <48h" },
  { value: "stale", label: "En retard >14j" },
];

export function ShowroomContent({ projects, categories }: ShowroomContentProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [freshnessFilter, setFreshnessFilter] = useState<string>("all");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      if (search.trim()) {
        const lower = search.toLowerCase();
        const matchesSearch =
          project.title.toLowerCase().includes(lower) ||
          project.description?.toLowerCase().includes(lower) ||
          project.the_ask?.toLowerCase().includes(lower) ||
          project.tags?.some((t) => t.toLowerCase().includes(lower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== "all" && project.category_id !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }

      // Freshness filter
      if (freshnessFilter !== "all") {
        const lastUpdate = new Date(project.last_updated_at || project.updated_at);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        const daysSinceUpdate = hoursSinceUpdate / 24;

        if (freshnessFilter === "recent" && hoursSinceUpdate > 48) {
          return false;
        }
        if (freshnessFilter === "stale" && daysSinceUpdate <= 14) {
          return false;
        }
      }

      return true;
    });
  }, [projects, search, categoryFilter, statusFilter, freshnessFilter]);

  const activeFilterCount = [
    categoryFilter !== "all",
    statusFilter !== "all",
    freshnessFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setFreshnessFilter("all");
  };

  // Get category object helper
  const getCategory = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId) || null;
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un projet..."
            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-neutral-900">
            <SelectItem value="all" className="text-white focus:bg-white/10">
              Toutes catégories
            </SelectItem>
            {categories.map((cat) => (
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

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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

        {/* Freshness Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`border-white/10 bg-white/5 text-white ${
                freshnessFilter !== "all" ? "border-violet-500/50 bg-violet-500/10" : ""
              }`}
            >
              {freshnessFilter === "recent" ? (
                <>
                  <Clock className="mr-2 h-4 w-4 text-emerald-400" />
                  Actif &lt;48h
                </>
              ) : freshnessFilter === "stale" ? (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-400" />
                  En retard
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Activité
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 border-white/10 bg-neutral-900 p-1">
            {FRESHNESS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFreshnessFilter(option.value)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  freshnessFilter === option.value
                    ? "bg-violet-500/20 text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-neutral-400 hover:text-white"
          >
            <X className="mr-1 h-4 w-4" />
            Effacer ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(categoryFilter !== "all" || statusFilter !== "all" || freshnessFilter !== "all") && (
        <div className="flex flex-wrap gap-2">
          {categoryFilter !== "all" && (
            <Badge
              variant="secondary"
              className="cursor-pointer bg-white/5 hover:bg-white/10"
              onClick={() => setCategoryFilter("all")}
            >
              {categories.find((c) => c.id === categoryFilter)?.name}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge
              variant="secondary"
              className="cursor-pointer bg-white/5 hover:bg-white/10"
              onClick={() => setStatusFilter("all")}
            >
              {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {freshnessFilter !== "all" && (
            <Badge
              variant="secondary"
              className="cursor-pointer bg-white/5 hover:bg-white/10"
              onClick={() => setFreshnessFilter("all")}
            >
              {FRESHNESS_OPTIONS.find((f) => f.value === freshnessFilter)?.label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-neutral-500">
        {filteredProjects.length} projet{filteredProjects.length !== 1 ? "s" : ""}{" "}
        {projects.length !== filteredProjects.length && `sur ${projects.length}`}
      </p>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-700 py-16">
          <Search className="h-12 w-12 text-neutral-600" />
          <p className="mt-4 text-lg font-medium text-neutral-400">
            Aucun résultat
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Essayez de modifier vos filtres
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="mt-4 border-white/10"
          >
            Effacer les filtres
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              category={getCategory(project.category_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
