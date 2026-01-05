"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Target,
  Circle,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import type { GanttData, GanttMilestone, Task, MilestoneStatus, TaskStatus } from "@/types";

interface GanttChartProps {
  data: GanttData;
  projectId: string;
  canEdit?: boolean;
  onMilestoneClick?: (milestone: GanttMilestone) => void;
  onTaskClick?: (task: Task, milestone: GanttMilestone | null) => void;
  onAddMilestone?: () => void;
  onAddTask?: (milestoneId: string | null) => void;
}

type ViewMode = "weeks" | "months" | "quarters";

const milestoneStatusConfig: Record<MilestoneStatus, { icon: typeof Target; color: string; barColor: string }> = {
  planned: { icon: Target, color: "text-neutral-400", barColor: "bg-neutral-500" },
  in_progress: { icon: Clock, color: "text-cyan-400", barColor: "bg-cyan-500" },
  completed: { icon: CheckCircle2, color: "text-emerald-400", barColor: "bg-emerald-500" },
  delayed: { icon: AlertTriangle, color: "text-amber-400", barColor: "bg-amber-500" },
  cancelled: { icon: XCircle, color: "text-rose-400", barColor: "bg-rose-500" },
};

const taskStatusConfig: Record<TaskStatus, { color: string; barColor: string }> = {
  backlog: { color: "text-neutral-500", barColor: "bg-neutral-600" },
  todo: { color: "text-neutral-400", barColor: "bg-neutral-500" },
  in_progress: { color: "text-cyan-400", barColor: "bg-cyan-500" },
  review: { color: "text-indigo-400", barColor: "bg-indigo-500" },
  done: { color: "text-emerald-400", barColor: "bg-emerald-500" },
  blocked: { color: "text-rose-400", barColor: "bg-rose-500" },
};

export function GanttChart({
  data,
  projectId,
  canEdit = false,
  onMilestoneClick,
  onTaskClick,
  onAddMilestone,
  onAddTask,
}: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("weeks");
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(
    new Set(data.milestones.map((m) => m.id))
  );
  const [dateRange, setDateRange] = useState({
    start: data.dateRange.start,
    end: data.dateRange.end,
  });
  const [isMobile, setIsMobile] = useState(false);

  const leftPaneRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync scroll between left pane and timeline
  useEffect(() => {
    const leftPane = leftPaneRef.current;
    const timeline = timelineRef.current;

    if (!leftPane || !timeline) return;

    const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
      target.scrollTop = source.scrollTop;
    };

    const handleLeftScroll = () => syncScroll(leftPane, timeline);
    const handleTimelineScroll = () => syncScroll(timeline, leftPane);

    leftPane.addEventListener("scroll", handleLeftScroll);
    timeline.addEventListener("scroll", handleTimelineScroll);

    return () => {
      leftPane.removeEventListener("scroll", handleLeftScroll);
      timeline.removeEventListener("scroll", handleTimelineScroll);
    };
  }, []);

  const toggleMilestone = (id: string) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMilestones(newExpanded);
  };

  // Calculate timeline columns based on view mode and date range
  const timelineColumns = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const columns: { date: Date; label: string; isToday?: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (viewMode === "weeks") {
      // Show individual days grouped by week
      const current = new Date(start);
      current.setDate(current.getDate() - current.getDay()); // Start from Sunday
      
      while (current <= end) {
        const isToday = current.toDateString() === today.toDateString();
        columns.push({
          date: new Date(current),
          label: current.getDate().toString(),
          isToday,
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (viewMode === "months") {
      // Show weeks
      const current = new Date(start);
      current.setDate(current.getDate() - current.getDay());
      
      while (current <= end) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const isCurrentWeek = today >= current && today <= weekEnd;
        
        columns.push({
          date: new Date(current),
          label: `W${getWeekNumber(current)}`,
          isToday: isCurrentWeek,
        });
        current.setDate(current.getDate() + 7);
      }
    } else {
      // quarters - show months
      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      
      while (current <= end) {
        const isCurrentMonth = today.getMonth() === current.getMonth() && 
                               today.getFullYear() === current.getFullYear();
        columns.push({
          date: new Date(current),
          label: current.toLocaleDateString("fr-FR", { month: "short" }),
          isToday: isCurrentMonth,
        });
        current.setMonth(current.getMonth() + 1);
      }
    }

    return columns;
  }, [dateRange, viewMode]);

  const columnWidth = viewMode === "weeks" ? 32 : viewMode === "months" ? 48 : 80;
  const totalWidth = timelineColumns.length * columnWidth;

  // Calculate bar position and width
  const getBarStyle = (startDate: string | null, endDate: string | null) => {
    if (!endDate) return null;

    const start = startDate ? new Date(startDate) : new Date(endDate);
    const end = new Date(endDate);
    const rangeStart = new Date(dateRange.start);

    const startOffset = Math.max(0, (start.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1);

    const pixelsPerDay = viewMode === "weeks" ? columnWidth : viewMode === "months" ? columnWidth / 7 : columnWidth / 30;

    return {
      left: startOffset * pixelsPerDay,
      width: Math.max(duration * pixelsPerDay, 8),
    };
  };

  // Find today's position
  const todayPosition = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeStart = new Date(dateRange.start);
    const rangeEnd = new Date(dateRange.end);

    if (today < rangeStart || today > rangeEnd) return null;

    const daysSinceStart = (today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
    const pixelsPerDay = viewMode === "weeks" ? columnWidth : viewMode === "months" ? columnWidth / 7 : columnWidth / 30;

    return daysSinceStart * pixelsPerDay;
  }, [dateRange, viewMode, columnWidth]);

  const exportCSV = () => {
    const rows: string[][] = [["Type", "Title", "Status", "Start Date", "End Date", "Progress"]];

    for (const m of data.milestones) {
      rows.push(["Milestone", m.title, m.status, m.start_date || "", m.target_date, `${m.progress_percent}%`]);
      for (const t of m.tasks) {
        rows.push(["Task", `  ${t.title}`, t.status, t.start_date || "", t.due_date || "", ""]);
      }
    }

    for (const t of data.unassignedTasks) {
      rows.push(["Task (Unassigned)", t.title, t.status, t.start_date || "", t.due_date || "", ""]);
    }

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roadmap-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Mobile list view fallback
  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="p-4 border-b border-white/10 bg-neutral-900/50">
          <h3 className="text-sm font-medium text-neutral-300 mb-2">Roadmap</h3>
          <Button variant="outline" size="sm" className="h-8 border-white/10 w-full" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {data.milestones.map((milestone) => {
            const config = milestoneStatusConfig[milestone.status];
            const Icon = config.icon;

            return (
              <div key={milestone.id} className="mb-4">
                <div
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer hover:border-white/10"
                  onClick={() => onMilestoneClick?.(milestone)}
                >
                  <div className={cn("p-2 rounded-lg", config.barColor, "bg-opacity-20")}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{milestone.title}</p>
                    <p className="text-xs text-neutral-500">
                      {milestone.start_date && `${formatDateShort(milestone.start_date)} → `}
                      {formatDateShort(milestone.target_date)}
                    </p>
                  </div>
                  <div className="text-xs text-neutral-500">{milestone.progress_percent}%</div>
                </div>

                <div className="ml-6 mt-1 space-y-1">
                  {milestone.tasks.map((task) => {
                    const taskConfig = taskStatusConfig[task.status];
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 py-2 px-3 rounded bg-white/[0.01] cursor-pointer hover:bg-white/[0.03]"
                        onClick={() => onTaskClick?.(task, milestone)}
                      >
                        <div className={cn("h-2 w-2 rounded-full", taskConfig.barColor)} />
                        <span className={cn(
                          "flex-1 text-sm truncate",
                          task.status === "done" ? "text-neutral-500 line-through" : "text-neutral-300"
                        )}>
                          {task.title}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-neutral-600">{formatDateShort(task.due_date)}</span>
                        )}
                      </div>
                    );
                  })}

                  {canEdit && (
                    <button
                      onClick={() => onAddTask?.(milestone.id)}
                      className="flex items-center gap-2 py-2 px-3 text-xs text-neutral-500 hover:text-violet-400"
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {canEdit && (
            <button
              onClick={onAddMilestone}
              className="flex items-center gap-2 p-3 text-sm text-neutral-500 hover:text-emerald-400 w-full border border-dashed border-white/10 rounded-lg mt-4"
            >
              <Plus className="h-4 w-4" />
              Ajouter un jalon
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/10 bg-neutral-900/50">
        <div className="hidden md:flex items-center gap-2">
          <Calendar className="h-4 w-4 text-neutral-400" />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((r) => ({ ...r, start: e.target.value }))}
            className="w-36 h-8 bg-white/[0.02] border-white/10 text-sm"
          />
          <span className="text-neutral-500">→</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((r) => ({ ...r, end: e.target.value }))}
            className="w-36 h-8 bg-white/[0.02] border-white/10 text-sm"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-white/[0.02] border border-white/10 p-0.5">
          {(["weeks", "months", "quarters"] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(mode)}
              className={cn(
                "h-7 px-3 text-xs font-medium",
                viewMode === mode
                  ? "bg-violet-600 text-white hover:bg-violet-600"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              {mode === "weeks" ? "Semaines" : mode === "months" ? "Mois" : "Trimestres"}
            </Button>
          ))}
        </div>

        <div className="flex-1" />

        <Button variant="outline" size="sm" className="h-8 border-white/10" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Main Gantt Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Phases & Tasks List */}
        <div
          ref={leftPaneRef}
          className="w-72 min-w-[280px] border-r border-white/10 overflow-y-auto overflow-x-hidden bg-neutral-950"
        >
          <div className="sticky top-0 z-10 h-12 px-4 flex items-center bg-neutral-900 border-b border-white/10">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Phases & Tâches</span>
          </div>

          <div className="py-1">
            {data.milestones.map((milestone) => {
              const isExpanded = expandedMilestones.has(milestone.id);
              const config = milestoneStatusConfig[milestone.status];
              const Icon = config.icon;

              return (
                <div key={milestone.id}>
                  {/* Milestone Row */}
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
                      "hover:bg-white/[0.02]"
                    )}
                    onClick={() => onMilestoneClick?.(milestone)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMilestone(milestone.id);
                      }}
                      className="p-0.5 rounded hover:bg-white/10"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-neutral-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-neutral-500" />
                      )}
                    </button>
                    <Icon className={cn("h-4 w-4", config.color)} />
                    <span className="flex-1 text-sm font-medium text-white truncate">
                      {milestone.title}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {milestone.tasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  {isExpanded && (
                    <div className="ml-6 border-l border-white/5">
                      {milestone.tasks.map((task) => {
                        const taskConfig = taskStatusConfig[task.status];
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors",
                              "hover:bg-white/[0.02] ml-2"
                            )}
                            onClick={() => onTaskClick?.(task, milestone)}
                          >
                            <div className={cn("h-2 w-2 rounded-full", taskConfig.barColor)} />
                            <span className={cn(
                              "flex-1 text-sm truncate",
                              task.status === "done" ? "text-neutral-500 line-through" : "text-neutral-300"
                            )}>
                              {task.title}
                            </span>
                          </div>
                        );
                      })}

                      {/* Add Task Button */}
                      {canEdit && (
                        <button
                          onClick={() => onAddTask?.(milestone.id)}
                          className="flex items-center gap-2 px-3 py-1.5 ml-2 text-xs text-neutral-500 hover:text-violet-400 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          Ajouter une tâche
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned Tasks */}
            {data.unassignedTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Tâches sans jalon
                  </span>
                </div>
                {data.unassignedTasks.map((task) => {
                  const taskConfig = taskStatusConfig[task.status];
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors",
                        "hover:bg-white/[0.02]"
                      )}
                      onClick={() => onTaskClick?.(task, null)}
                    >
                      <div className={cn("h-2 w-2 rounded-full", taskConfig.barColor)} />
                      <span className="flex-1 text-sm text-neutral-300 truncate">
                        {task.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Milestone Button */}
            {canEdit && (
              <button
                onClick={onAddMilestone}
                className="flex items-center gap-2 px-4 py-3 mt-2 text-sm text-neutral-500 hover:text-emerald-400 transition-colors w-full border-t border-white/5"
              >
                <Plus className="h-4 w-4" />
                Ajouter un jalon
              </button>
            )}
          </div>
        </div>

        {/* Right Pane - Timeline */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-auto bg-neutral-950/50"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Timeline Header */}
          <div
            className="sticky top-0 z-10 h-12 flex bg-neutral-900 border-b border-white/10"
            style={{ width: totalWidth }}
          >
            {timelineColumns.map((col, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-center text-xs border-r border-white/5",
                  col.isToday ? "bg-violet-500/10 text-violet-400 font-medium" : "text-neutral-500"
                )}
                style={{ width: columnWidth, minWidth: columnWidth }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Timeline Content */}
          <div className="relative" style={{ width: totalWidth }}>
            {/* Today Line */}
            {todayPosition !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-violet-500/50 z-20"
                style={{ left: todayPosition }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-violet-500 rounded text-[10px] text-white font-medium">
                  Aujourd'hui
                </div>
              </div>
            )}

            {/* Grid Background */}
            <div className="absolute inset-0 flex">
              {timelineColumns.map((col, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "border-r border-white/[0.02]",
                    col.isToday && "bg-violet-500/5"
                  )}
                  style={{ width: columnWidth, minWidth: columnWidth }}
                />
              ))}
            </div>

            {/* Bars */}
            <div className="relative py-1">
              {data.milestones.map((milestone) => {
                const isExpanded = expandedMilestones.has(milestone.id);
                const config = milestoneStatusConfig[milestone.status];
                const barStyle = getBarStyle(milestone.start_date, milestone.target_date);

                return (
                  <div key={milestone.id}>
                    {/* Milestone Bar */}
                    <div className="relative h-9 flex items-center">
                      {barStyle && (
                        <div
                          className={cn(
                            "absolute h-6 rounded-md cursor-pointer transition-all",
                            "hover:ring-2 hover:ring-white/20",
                            config.barColor,
                            "opacity-80 hover:opacity-100"
                          )}
                          style={{
                            left: barStyle.left,
                            width: barStyle.width,
                          }}
                          onClick={() => onMilestoneClick?.(milestone)}
                        >
                          {/* Progress indicator */}
                          <div
                            className="absolute inset-y-0 left-0 rounded-l-md bg-white/20"
                            style={{ width: `${milestone.progress_percent}%` }}
                          />
                          {barStyle.width > 60 && (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white truncate px-2">
                              {milestone.title}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Task Bars */}
                    {isExpanded &&
                      milestone.tasks.map((task) => {
                        const taskConfig = taskStatusConfig[task.status];
                        const taskBarStyle = getBarStyle(task.start_date, task.due_date);

                        return (
                          <div key={task.id} className="relative h-7 flex items-center">
                            {taskBarStyle && (
                              <div
                                className={cn(
                                  "absolute h-4 rounded cursor-pointer transition-all",
                                  "hover:ring-2 hover:ring-white/20",
                                  taskConfig.barColor,
                                  "opacity-70 hover:opacity-100"
                                )}
                                style={{
                                  left: taskBarStyle.left,
                                  width: taskBarStyle.width,
                                }}
                                onClick={() => onTaskClick?.(task, milestone)}
                              />
                            )}
                          </div>
                        );
                      })}

                    {/* Add task row placeholder */}
                    {isExpanded && canEdit && (
                      <div className="h-7" />
                    )}
                  </div>
                );
              })}

              {/* Unassigned Tasks */}
              {data.unassignedTasks.length > 0 && (
                <div className="pt-4 mt-4 border-t border-white/5">
                  <div className="h-8" /> {/* Header space */}
                  {data.unassignedTasks.map((task) => {
                    const taskConfig = taskStatusConfig[task.status];
                    const taskBarStyle = getBarStyle(task.start_date, task.due_date);

                    return (
                      <div key={task.id} className="relative h-7 flex items-center">
                        {taskBarStyle && (
                          <div
                            className={cn(
                              "absolute h-4 rounded cursor-pointer transition-all",
                              "hover:ring-2 hover:ring-white/20",
                              taskConfig.barColor,
                              "opacity-70 hover:opacity-100"
                            )}
                            style={{
                              left: taskBarStyle.left,
                              width: taskBarStyle.width,
                            }}
                            onClick={() => onTaskClick?.(task, null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add milestone row placeholder */}
              {canEdit && <div className="h-10" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Helper function to format date short
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

