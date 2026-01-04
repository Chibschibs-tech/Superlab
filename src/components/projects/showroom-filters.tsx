"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category, ProjectStatus } from "@/types";

export interface FilterState {
  search: string;
  categories: string[];
  stages: ProjectStatus[];
  freshness: "all" | "recent" | "stale";
}

interface ShowroomFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
}

const STAGES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "Idea", label: "Idée", color: "bg-purple-500" },
  { value: "Validation", label: "Validation", color: "bg-blue-500" },
  { value: "Scaling", label: "Scaling", color: "bg-emerald-500" },
  { value: "Stalled", label: "En pause", color: "bg-red-500" },
  { value: "Supported", label: "Soutenu", color: "bg-amber-500" },
];

const FRESHNESS_OPTIONS = [
  { value: "all" as const, label: "Tous", icon: null },
  { value: "recent" as const, label: "Récents (<48h)", icon: Clock },
  { value: "stale" as const, label: "En retard (>14j)", icon: AlertTriangle },
];

export function ShowroomFilters({
  categories,
  filters,
  onFiltersChange,
  resultCount,
}: ShowroomFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const projectCategories = categories.filter((c) => c.type === "project");
  
  const activeFiltersCount =
    filters.categories.length +
    filters.stages.length +
    (filters.freshness !== "all" ? 1 : 0);

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleStageToggle = (stage: ProjectStatus) => {
    const newStages = filters.stages.includes(stage)
      ? filters.stages.filter((s) => s !== stage)
      : [...filters.stages, stage];
    onFiltersChange({ ...filters, stages: newStages });
  };

  const handleFreshnessChange = (freshness: FilterState["freshness"]) => {
    onFiltersChange({ ...filters, freshness });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      categories: [],
      stages: [],
      freshness: "all",
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder="Rechercher un projet..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-neutral-500"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`border-white/10 bg-white/5 ${
                  filters.categories.length > 0 ? "border-violet-500/50" : ""
                }`}
              >
                <Filter className="mr-2 h-4 w-4" />
                Catégorie
                {filters.categories.length > 0 && (
                  <Badge className="ml-2 bg-violet-600">{filters.categories.length}</Badge>
                )}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-white/10 bg-neutral-900" align="end">
              <DropdownMenuLabel className="text-neutral-400">
                Filtrer par catégorie
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {projectCategories.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat.id}
                  checked={filters.categories.includes(cat.id)}
                  onCheckedChange={() => handleCategoryToggle(cat.id)}
                  className="text-white focus:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color || "#6366f1" }}
                    />
                    {cat.name}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Stage Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`border-white/10 bg-white/5 ${
                  filters.stages.length > 0 ? "border-violet-500/50" : ""
                }`}
              >
                Stade
                {filters.stages.length > 0 && (
                  <Badge className="ml-2 bg-violet-600">{filters.stages.length}</Badge>
                )}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 border-white/10 bg-neutral-900" align="end">
              <DropdownMenuLabel className="text-neutral-400">
                Filtrer par stade
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {STAGES.map((stage) => (
                <DropdownMenuCheckboxItem
                  key={stage.value}
                  checked={filters.stages.includes(stage.value)}
                  onCheckedChange={() => handleStageToggle(stage.value)}
                  className="text-white focus:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                    {stage.label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Freshness Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`border-white/10 bg-white/5 ${
                  filters.freshness !== "all" ? "border-violet-500/50" : ""
                }`}
              >
                {filters.freshness === "recent" ? (
                  <Clock className="mr-2 h-4 w-4 text-emerald-400" />
                ) : filters.freshness === "stale" ? (
                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-400" />
                ) : null}
                Activité
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 border-white/10 bg-neutral-900" align="end">
              <DropdownMenuLabel className="text-neutral-400">
                Filtrer par activité
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {FRESHNESS_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={filters.freshness === opt.value}
                  onCheckedChange={() => handleFreshnessChange(opt.value)}
                  className="text-white focus:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    {opt.icon && <opt.icon className="h-3.5 w-3.5" />}
                    {opt.label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-neutral-400 hover:text-white"
            >
              <X className="mr-1 h-4 w-4" />
              Effacer ({activeFiltersCount})
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <span>{resultCount} projet{resultCount !== 1 ? "s" : ""}</span>
        {activeFiltersCount > 0 && (
          <span className="text-neutral-500">• filtres actifs</span>
        )}
      </div>
    </div>
  );
}

