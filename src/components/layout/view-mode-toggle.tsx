"use client";

import { Briefcase, FlaskConical } from "lucide-react";
import { useViewMode } from "@/contexts/view-mode-context";
import { cn } from "@/lib/utils";

interface ViewModeToggleProps {
  collapsed?: boolean;
}

export function ViewModeToggle({ collapsed = false }: ViewModeToggleProps) {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div
      className={cn(
        "flex items-center rounded-xl p-1",
        "bg-white/[0.03]",
        "border border-white/5",
        collapsed ? "flex-col gap-1" : "gap-1"
      )}
    >
      <button
        onClick={() => setViewMode("owner")}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          viewMode === "owner"
            ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 shadow-lg shadow-amber-500/10"
            : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5",
          collapsed && "px-2 py-2"
        )}
        aria-label="Mode Dirigeant"
        aria-pressed={viewMode === "owner"}
      >
        <Briefcase className="h-4 w-4" />
        {!collapsed && <span>Dirigeant</span>}
      </button>
      <button
        onClick={() => setViewMode("lab")}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          viewMode === "lab"
            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10"
            : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5",
          collapsed && "px-2 py-2"
        )}
        aria-label="Mode Lab"
        aria-pressed={viewMode === "lab"}
      >
        <FlaskConical className="h-4 w-4" />
        {!collapsed && <span>Lab</span>}
      </button>
    </div>
  );
}

