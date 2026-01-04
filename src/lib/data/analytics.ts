import { createClient } from "@/lib/supabase/server";
import { mockProjects, mockDecisions } from "./mock-data";
import type { 
  Project, 
  Milestone, 
  Task, 
  Decision, 
  ProjectStatus,
  MilestoneStatus,
  TaskStatus,
  DecisionStatus 
} from "@/types";

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

// ============================================
// TYPES
// ============================================

export interface StageDistribution {
  status: ProjectStatus;
  count: number;
  percentage: number;
}

export interface StaleProject {
  id: string;
  title: string;
  slug: string;
  status: ProjectStatus;
  lastUpdated: string;
  daysSinceUpdate: number;
}

export interface BlockedItem {
  id: string;
  title: string;
  projectTitle: string;
  projectSlug: string;
  type: "task" | "milestone";
  blockedSince: string;
  daysSinceBlocked: number;
}

export interface UpcomingMilestone {
  id: string;
  title: string;
  projectTitle: string;
  projectSlug: string;
  targetDate: string;
  daysUntilDue: number;
  status: MilestoneStatus;
  progressPercent: number;
}

export interface PendingDecision {
  id: string;
  question: string;
  projectTitle: string;
  projectSlug: string;
  createdAt: string;
  daysPending: number;
}

export interface PendingAsk {
  id: string;
  projectTitle: string;
  projectSlug: string;
  theAsk: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface PortfolioHealthMetrics {
  totalProjects: number;
  stageDistribution: StageDistribution[];
  staleProjects: StaleProject[];
  blockedItems: BlockedItem[];
  healthScore: number; // 0-100
}

export interface MomentumMetrics {
  upcomingMilestones: UpcomingMilestone[];
  milestonesCompletedThisMonth: number;
  milestoneTotalThisMonth: number;
  milestoneCompletionRate: number; // percentage
  pendingDecisions: PendingDecision[];
  avgDecisionTimeInDays: number;
  tasksCompletedThisWeek: number;
  velocityTrend: "up" | "down" | "stable";
}

export interface ForecastMetrics {
  pendingAsks: PendingAsk[];
  totalAskValue: string;
  projectsNeedingAttention: number;
  projectedCompletions: number; // next 30 days
  resourceRequests: {
    budget: number;
    headcount: number;
    other: number;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateHealthScore(
  staleCount: number,
  blockedCount: number,
  totalProjects: number,
  scalingCount: number
): number {
  if (totalProjects === 0) return 100;
  
  const staleImpact = (staleCount / totalProjects) * 30; // Max 30 point reduction
  const blockedImpact = Math.min(blockedCount * 5, 25); // Max 25 point reduction
  const scalingBonus = (scalingCount / totalProjects) * 15; // Max 15 point bonus
  
  return Math.max(0, Math.min(100, 85 - staleImpact - blockedImpact + scalingBonus));
}

// ============================================
// DATA FETCHING
// ============================================

export async function getPortfolioHealthMetrics(): Promise<PortfolioHealthMetrics> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const staleThreshold = 14; // days

    // Fetch all projects
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("last_updated_at", { ascending: false });

    if (projectsError) throw projectsError;

    // Fetch blocked tasks
    const { data: blockedTasks } = await supabase
      .from("tasks")
      .select("*, projects(title, slug)")
      .eq("status", "blocked");

    // Fetch delayed milestones
    const { data: delayedMilestones } = await supabase
      .from("milestones")
      .select("*, projects(title, slug)")
      .eq("status", "delayed");

    const projectList = (projects ?? []) as Project[];
    
    // Calculate stage distribution
    const statusCounts: Record<ProjectStatus, number> = {
      Idea: 0,
      Validation: 0,
      Scaling: 0,
      Stalled: 0,
      Supported: 0,
    };

    projectList.forEach((p) => {
      statusCounts[p.status]++;
    });

    const totalProjects = projectList.length;
    const stageDistribution: StageDistribution[] = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status: status as ProjectStatus,
        count,
        percentage: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
      })
    );

    // Calculate stale projects (> 14 days since update)
    const staleProjects: StaleProject[] = projectList
      .filter((p) => {
        const daysSince = daysBetween(new Date(p.last_updated_at), now);
        return daysSince > staleThreshold;
      })
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        lastUpdated: p.last_updated_at,
        daysSinceUpdate: daysBetween(new Date(p.last_updated_at), now),
      }))
      .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

    // Calculate blocked items
    const blockedItems: BlockedItem[] = [
      ...(blockedTasks ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        projectTitle: t.projects?.title ?? "Unknown",
        projectSlug: t.projects?.slug ?? "",
        type: "task" as const,
        blockedSince: t.updated_at,
        daysSinceBlocked: daysBetween(new Date(t.updated_at), now),
      })),
      ...(delayedMilestones ?? []).map((m: any) => ({
        id: m.id,
        title: m.title,
        projectTitle: m.projects?.title ?? "Unknown",
        projectSlug: m.projects?.slug ?? "",
        type: "milestone" as const,
        blockedSince: m.updated_at,
        daysSinceBlocked: daysBetween(new Date(m.updated_at), now),
      })),
    ].sort((a, b) => b.daysSinceBlocked - a.daysSinceBlocked);

    const healthScore = calculateHealthScore(
      staleProjects.length,
      blockedItems.length,
      totalProjects,
      statusCounts.Scaling
    );

    return {
      totalProjects,
      stageDistribution,
      staleProjects,
      blockedItems,
      healthScore,
    };
  } catch (error) {
    console.warn("Using mock data for portfolio health:", error);
    
    if (USE_MOCK_DATA) {
      const now = new Date();
      const staleThreshold = 14;
      
      const statusCounts: Record<ProjectStatus, number> = {
        Idea: 0,
        Validation: 0,
        Scaling: 0,
        Stalled: 0,
        Supported: 0,
      };

      mockProjects.forEach((p) => {
        statusCounts[p.status]++;
      });

      const totalProjects = mockProjects.length;
      const stageDistribution: StageDistribution[] = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status: status as ProjectStatus,
          count,
          percentage: totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
        })
      );

      const staleProjects: StaleProject[] = mockProjects
        .filter((p) => {
          const daysSince = daysBetween(new Date(p.last_updated_at), now);
          return daysSince > staleThreshold;
        })
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.status,
          lastUpdated: p.last_updated_at,
          daysSinceUpdate: daysBetween(new Date(p.last_updated_at), now),
        }));

      return {
        totalProjects,
        stageDistribution,
        staleProjects,
        blockedItems: [],
        healthScore: calculateHealthScore(staleProjects.length, 0, totalProjects, statusCounts.Scaling),
      };
    }

    return {
      totalProjects: 0,
      stageDistribution: [],
      staleProjects: [],
      blockedItems: [],
      healthScore: 0,
    };
  }
}

export async function getMomentumMetrics(): Promise<MomentumMetrics> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch upcoming milestones (next 30 days)
    const { data: upcomingMilestones } = await supabase
      .from("milestones")
      .select("*, projects(title, slug)")
      .gte("target_date", now.toISOString().split("T")[0])
      .lte("target_date", thirtyDaysFromNow.toISOString().split("T")[0])
      .neq("status", "completed")
      .neq("status", "cancelled")
      .order("target_date", { ascending: true });

    // Fetch milestones for this month (for completion rate)
    const { data: monthMilestones } = await supabase
      .from("milestones")
      .select("*")
      .gte("target_date", startOfMonth.toISOString().split("T")[0])
      .lte("target_date", now.toISOString().split("T")[0]);

    // Fetch completed tasks this week
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "done")
      .gte("completed_at", startOfWeek.toISOString());

    // Fetch pending decisions
    const { data: pendingDecisions } = await supabase
      .from("decisions")
      .select("*, projects(title, slug)")
      .eq("status", "Pending")
      .order("created_at", { ascending: true });

    // Fetch approved decisions for avg decision time
    const { data: approvedDecisions } = await supabase
      .from("decisions")
      .select("*")
      .eq("status", "Approved")
      .not("decided_at", "is", null);

    // Calculate milestone completion rate
    const monthMilestoneList = monthMilestones ?? [];
    const completedThisMonth = monthMilestoneList.filter(
      (m: any) => m.status === "completed"
    ).length;
    const milestoneCompletionRate =
      monthMilestoneList.length > 0
        ? Math.round((completedThisMonth / monthMilestoneList.length) * 100)
        : 0;

    // Calculate avg decision time
    const approvedList = approvedDecisions ?? [];
    let totalDecisionTime = 0;
    approvedList.forEach((d: any) => {
      if (d.decided_at && d.created_at) {
        totalDecisionTime += daysBetween(new Date(d.created_at), new Date(d.decided_at));
      }
    });
    const avgDecisionTimeInDays =
      approvedList.length > 0 ? Math.round(totalDecisionTime / approvedList.length) : 0;

    // Format upcoming milestones
    const formattedUpcoming: UpcomingMilestone[] = (upcomingMilestones ?? []).map(
      (m: any) => ({
        id: m.id,
        title: m.title,
        projectTitle: m.projects?.title ?? "Unknown",
        projectSlug: m.projects?.slug ?? "",
        targetDate: m.target_date,
        daysUntilDue: daysBetween(now, new Date(m.target_date)),
        status: m.status,
        progressPercent: m.progress_percent,
      })
    );

    // Format pending decisions
    const formattedPending: PendingDecision[] = (pendingDecisions ?? []).map(
      (d: any) => ({
        id: d.id,
        question: d.question,
        projectTitle: d.projects?.title ?? "Unknown",
        projectSlug: d.projects?.slug ?? "",
        createdAt: d.created_at,
        daysPending: daysBetween(new Date(d.created_at), now),
      })
    );

    // Determine velocity trend (simplified - compare this week vs last week)
    const tasksThisWeek = completedTasks?.length ?? 0;
    const velocityTrend: "up" | "down" | "stable" = 
      tasksThisWeek > 5 ? "up" : tasksThisWeek < 2 ? "down" : "stable";

    return {
      upcomingMilestones: formattedUpcoming,
      milestonesCompletedThisMonth: completedThisMonth,
      milestoneTotalThisMonth: monthMilestoneList.length,
      milestoneCompletionRate,
      pendingDecisions: formattedPending,
      avgDecisionTimeInDays,
      tasksCompletedThisWeek: tasksThisWeek,
      velocityTrend,
    };
  } catch (error) {
    console.warn("Using mock data for momentum:", error);

    if (USE_MOCK_DATA) {
      const now = new Date();
      
      const formattedPending: PendingDecision[] = mockDecisions
        .filter((d) => d.status === "Pending")
        .map((d) => {
          const project = mockProjects.find((p) => p.id === d.project_id);
          return {
            id: d.id,
            question: d.question,
            projectTitle: project?.title ?? "Unknown",
            projectSlug: project?.slug ?? "",
            createdAt: d.created_at,
            daysPending: daysBetween(new Date(d.created_at), now),
          };
        });

      return {
        upcomingMilestones: [],
        milestonesCompletedThisMonth: 0,
        milestoneTotalThisMonth: 0,
        milestoneCompletionRate: 0,
        pendingDecisions: formattedPending,
        avgDecisionTimeInDays: 3,
        tasksCompletedThisWeek: 0,
        velocityTrend: "stable",
      };
    }

    return {
      upcomingMilestones: [],
      milestonesCompletedThisMonth: 0,
      milestoneTotalThisMonth: 0,
      milestoneCompletionRate: 0,
      pendingDecisions: [],
      avgDecisionTimeInDays: 0,
      tasksCompletedThisWeek: 0,
      velocityTrend: "stable",
    };
  }
}

export async function getForecastMetrics(): Promise<ForecastMetrics> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Fetch projects with pending asks (not Supported)
    const { data: projectsWithAsks } = await supabase
      .from("projects")
      .select("*")
      .not("the_ask", "is", null)
      .neq("status", "Supported")
      .order("created_at", { ascending: false });

    // Fetch commitments
    const { data: commitments } = await supabase
      .from("commitments")
      .select("*")
      .eq("status", "requested");

    // Fetch milestones due in next 30 days (for projected completions)
    const { data: upcomingMilestones } = await supabase
      .from("milestones")
      .select("*")
      .gte("target_date", now.toISOString().split("T")[0])
      .lte("target_date", thirtyDaysFromNow.toISOString().split("T")[0])
      .eq("status", "in_progress");

    // Fetch stalled projects
    const { data: stalledProjects } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "Stalled");

    const projectList = projectsWithAsks ?? [];
    
    // Format pending asks
    const pendingAsks: PendingAsk[] = projectList.map((p: any) => ({
      id: p.id,
      projectTitle: p.title,
      projectSlug: p.slug,
      theAsk: p.the_ask,
      status: p.status,
      createdAt: p.created_at,
    }));

    // Calculate total ask value (parse €/$ amounts from the_ask strings)
    let totalValue = 0;
    projectList.forEach((p: any) => {
      if (p.the_ask) {
        const match = p.the_ask.match(/(\d+[\s,.]?\d*)\s*[€$kK]/);
        if (match) {
          let value = parseFloat(match[1].replace(/[\s,]/g, ""));
          if (p.the_ask.toLowerCase().includes("k")) {
            value *= 1000;
          }
          totalValue += value;
        }
      }
    });

    // Calculate resource requests from commitments
    const commitmentList = commitments ?? [];
    const resourceRequests = {
      budget: commitmentList.filter((c: any) => c.type === "budget").length,
      headcount: commitmentList.filter((c: any) => c.type === "headcount").length,
      other: commitmentList.filter(
        (c: any) => !["budget", "headcount"].includes(c.type)
      ).length,
    };

    return {
      pendingAsks,
      totalAskValue: totalValue > 0 ? `${Math.round(totalValue / 1000)}K€` : "N/A",
      projectsNeedingAttention: (stalledProjects?.length ?? 0) + pendingAsks.length,
      projectedCompletions: upcomingMilestones?.length ?? 0,
      resourceRequests,
    };
  } catch (error) {
    console.warn("Using mock data for forecast:", error);

    if (USE_MOCK_DATA) {
      const pendingAsks: PendingAsk[] = mockProjects
        .filter((p) => p.the_ask && p.status !== "Supported")
        .map((p) => ({
          id: p.id,
          projectTitle: p.title,
          projectSlug: p.slug,
          theAsk: p.the_ask!,
          status: p.status,
          createdAt: p.created_at,
        }));

      // Calculate total from mock data
      let totalValue = 0;
      pendingAsks.forEach((p) => {
        const match = p.theAsk.match(/(\d+[\s,.]?\d*)\s*[€$kK]/);
        if (match) {
          let value = parseFloat(match[1].replace(/[\s,]/g, ""));
          if (p.theAsk.toLowerCase().includes("k")) {
            value *= 1000;
          }
          totalValue += value;
        }
      });

      return {
        pendingAsks,
        totalAskValue: totalValue > 0 ? `${Math.round(totalValue / 1000)}K€` : "N/A",
        projectsNeedingAttention: mockProjects.filter((p) => p.status === "Stalled").length + pendingAsks.length,
        projectedCompletions: 0,
        resourceRequests: { budget: 3, headcount: 2, other: 1 },
      };
    }

    return {
      pendingAsks: [],
      totalAskValue: "N/A",
      projectsNeedingAttention: 0,
      projectedCompletions: 0,
      resourceRequests: { budget: 0, headcount: 0, other: 0 },
    };
  }
}

// Combined analytics fetch
export async function getAllAnalytics() {
  const [portfolioHealth, momentum, forecast] = await Promise.all([
    getPortfolioHealthMetrics(),
    getMomentumMetrics(),
    getForecastMetrics(),
  ]);

  return { portfolioHealth, momentum, forecast };
}


