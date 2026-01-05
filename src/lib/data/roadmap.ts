"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  GanttData,
  GanttMilestone,
  Task,
  Milestone,
  HealthScore,
  HealthLevel,
  ProjectKPIs,
  ProjectMemberWithUser,
} from "@/types";

// ============================================
// ROADMAP / GANTT DATA
// ============================================

export async function getRoadmapData(projectId: string): Promise<GanttData | null> {
  const supabase = await createClient();

  // Fetch milestones ordered by order_index, then sort_order, then created_at
  const { data: milestones, error: milestonesError } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (milestonesError) {
    console.error("Error fetching milestones:", milestonesError);
    return null;
  }

  // Fetch tasks ordered by order_index
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError);
    return null;
  }

  // Group tasks by milestone
  const tasksByMilestone: Record<string, Task[]> = {};
  const unassignedTasks: Task[] = [];

  for (const task of tasks || []) {
    if (task.milestone_id) {
      if (!tasksByMilestone[task.milestone_id]) {
        tasksByMilestone[task.milestone_id] = [];
      }
      tasksByMilestone[task.milestone_id].push(task as Task);
    } else {
      unassignedTasks.push(task as Task);
    }
  }

  // Build gantt milestones with nested tasks
  const ganttMilestones: GanttMilestone[] = (milestones || []).map((m) => ({
    ...m,
    tasks: tasksByMilestone[m.id] || [],
  })) as GanttMilestone[];

  // Calculate date range from all items
  const allDates: Date[] = [];
  
  for (const m of ganttMilestones) {
    if (m.start_date) allDates.push(new Date(m.start_date));
    if (m.target_date) allDates.push(new Date(m.target_date));
    for (const t of m.tasks) {
      if (t.start_date) allDates.push(new Date(t.start_date));
      if (t.due_date) allDates.push(new Date(t.due_date));
    }
  }
  
  for (const t of unassignedTasks) {
    if (t.start_date) allDates.push(new Date(t.start_date));
    if (t.due_date) allDates.push(new Date(t.due_date));
  }

  // Default to current quarter if no dates
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

  let minDate = quarterStart;
  let maxDate = quarterEnd;

  if (allDates.length > 0) {
    const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());
    minDate = sortedDates[0];
    maxDate = sortedDates[sortedDates.length - 1];
    
    // Add some padding (1 week before and after)
    minDate = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    maxDate = new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return {
    milestones: ganttMilestones,
    unassignedTasks,
    dateRange: {
      start: minDate.toISOString().split("T")[0],
      end: maxDate.toISOString().split("T")[0],
    },
  };
}

// ============================================
// HEALTH SCORE CALCULATION
// ============================================

export async function calculateHealthScore(projectId: string): Promise<HealthScore> {
  const supabase = await createClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = now.toISOString().split("T")[0];

  // Get last update
  const { data: lastUpdate } = await supabase
    .from("updates")
    .select("created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get overdue milestones
  const { count: overdueMilestones } = await supabase
    .from("milestones")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .lt("target_date", today)
    .not("status", "in", '("completed","cancelled")');

  // Get overdue tasks
  const { count: overdueTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .lt("due_date", today)
    .neq("status", "done");

  // Get pending decisions
  const { count: pendingDecisions } = await supabase
    .from("decisions")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("status", "Pending");

  // Calculate penalties
  let score = 100;
  const factors = {
    lastUpdatePenalty: 0,
    overdueMilestonesPenalty: 0,
    overdueTasksPenalty: 0,
    pendingDecisionsPenalty: 0,
  };

  // -15 if last update > 7 days
  if (!lastUpdate || new Date(lastUpdate.created_at) < sevenDaysAgo) {
    factors.lastUpdatePenalty = 15;
    score -= 15;
  }

  // -10 per overdue milestone
  const milestonePenalty = (overdueMilestones || 0) * 10;
  factors.overdueMilestonesPenalty = milestonePenalty;
  score -= milestonePenalty;

  // -5 per overdue task, capped at 30
  const taskPenalty = Math.min((overdueTasks || 0) * 5, 30);
  factors.overdueTasksPenalty = taskPenalty;
  score -= taskPenalty;

  // -10 if pending decisions > 3
  if ((pendingDecisions || 0) > 3) {
    factors.pendingDecisionsPenalty = 10;
    score -= 10;
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level and label
  let level: HealthLevel;
  let label: string;

  if (score >= 85) {
    level = "excellent";
    label = "Excellent";
  } else if (score >= 70) {
    level = "good";
    label = "Bon";
  } else if (score >= 50) {
    level = "warning";
    label = "Attention";
  } else {
    level = "critical";
    label = "Critique";
  }

  return { score, level, label, factors };
}

// ============================================
// PROJECT KPIs
// ============================================

export async function getProjectKPIs(projectId: string): Promise<ProjectKPIs> {
  const supabase = await createClient();
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get project budget info
  const { data: project } = await supabase
    .from("projects")
    .select("budget_total, budget_used, launch_date")
    .eq("id", projectId)
    .single();

  // Calculate budget from commitments if budget_used is not set
  let budgetUsed = project?.budget_used || 0;
  
  if (!project?.budget_used) {
    const { data: commitments } = await supabase
      .from("commitments")
      .select("amount")
      .eq("project_id", projectId)
      .eq("status", "approved");

    if (commitments && commitments.length > 0) {
      budgetUsed = commitments.reduce((sum, c) => sum + (c.amount || 0), 0);
    }
  }

  // Sprint velocity: tasks completed in last 14 days
  const { count: completedTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("status", "done")
    .gte("completed_at", fourteenDaysAgo.toISOString());

  // Days to launch
  let daysToLaunch: number | null = null;
  if (project?.launch_date) {
    const launchDate = new Date(project.launch_date);
    const diffTime = launchDate.getTime() - now.getTime();
    daysToLaunch = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Health score
  const healthScore = await calculateHealthScore(projectId);

  // Budget percent
  let budgetPercent: number | null = null;
  if (project?.budget_total && project.budget_total > 0) {
    budgetPercent = Math.round((budgetUsed / project.budget_total) * 100);
  }

  return {
    budgetUsed,
    budgetTotal: project?.budget_total || null,
    budgetPercent,
    sprintVelocity: completedTasks || 0,
    daysToLaunch,
    healthScore,
  };
}

// ============================================
// PROJECT TEAM MEMBERS
// ============================================

export async function getProjectTeam(projectId: string): Promise<ProjectMemberWithUser[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("project_members")
    .select(`
      *,
      user:users(*)
    `)
    .eq("project_id", projectId);

  if (error) {
    console.error("Error fetching team:", error);
    return [];
  }

  return members as ProjectMemberWithUser[];
}

