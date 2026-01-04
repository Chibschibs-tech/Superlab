import { createClient } from "@/lib/supabase/server";
import { mockProjects, getMockProjectBySlug, mockDecisions, mockNeeds, mockMilestones } from "./mock-data";
import type { Project } from "@/types";

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

// ============================================
// EXECUTIVE SIGNALS TYPE
// ============================================

export interface ExecutiveSignals {
  pendingDecisions: number;
  openNeeds: number;
  nextMilestone: { title: string; dueDate: string } | null;
  ownerAvatar: string | null;
  ownerName: string | null;
}

// ============================================
// GET PROJECTS
// ============================================

export async function getProjects(): Promise<Project[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("last_updated_at", { ascending: false });

    if (error) {
      console.warn("Supabase error, using mock data:", error.message);
      if (USE_MOCK_DATA) {
        return mockProjects;
      }
      return [];
    }

    return data as Project[];
  } catch (error) {
    console.warn("Failed to connect to Supabase, using mock data");
    if (USE_MOCK_DATA) {
      return mockProjects;
    }
    return [];
  }
}

// ============================================
// GET PROJECT BY SLUG
// ============================================

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.warn("Supabase error, using mock data:", error.message);
      if (USE_MOCK_DATA) {
        return getMockProjectBySlug(slug) || null;
      }
      return null;
    }

    return data as Project;
  } catch (error) {
    console.warn("Failed to connect to Supabase, using mock data");
    if (USE_MOCK_DATA) {
      return getMockProjectBySlug(slug) || null;
    }
    return null;
  }
}

// ============================================
// GET EXECUTIVE SIGNALS FOR ALL PROJECTS
// ============================================

export async function getProjectSignals(): Promise<Record<string, ExecutiveSignals>> {
  try {
    const supabase = await createClient();

    // Fetch all pending decisions
    const { data: decisions } = await supabase
      .from("decisions")
      .select("project_id")
      .in("status", ["Pending", "InfoRequested"]);

    // Fetch all open needs
    const { data: needs } = await supabase
      .from("needs")
      .select("project_id")
      .in("status", ["Open", "InReview"]);

    // Fetch upcoming milestones (next 60 days)
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    
    const { data: milestones } = await supabase
      .from("milestones")
      .select("project_id, title, due_date")
      .neq("status", "Completed")
      .lte("due_date", sixtyDaysFromNow.toISOString())
      .order("due_date", { ascending: true });

    // Build signals map
    const signals: Record<string, ExecutiveSignals> = {};

    // Count decisions by project
    for (const d of decisions || []) {
      if (!signals[d.project_id]) {
        signals[d.project_id] = {
          pendingDecisions: 0,
          openNeeds: 0,
          nextMilestone: null,
          ownerAvatar: null,
          ownerName: null,
        };
      }
      signals[d.project_id].pendingDecisions++;
    }

    // Count needs by project
    for (const n of needs || []) {
      if (!signals[n.project_id]) {
        signals[n.project_id] = {
          pendingDecisions: 0,
          openNeeds: 0,
          nextMilestone: null,
          ownerAvatar: null,
          ownerName: null,
        };
      }
      signals[n.project_id].openNeeds++;
    }

    // Find next milestone for each project
    const seenProjects = new Set<string>();
    for (const m of milestones || []) {
      if (!seenProjects.has(m.project_id) && m.due_date) {
        seenProjects.add(m.project_id);
        if (!signals[m.project_id]) {
          signals[m.project_id] = {
            pendingDecisions: 0,
            openNeeds: 0,
            nextMilestone: null,
            ownerAvatar: null,
            ownerName: null,
          };
        }
        signals[m.project_id].nextMilestone = {
          title: m.title,
          dueDate: m.due_date,
        };
      }
    }

    return signals;
  } catch (error) {
    console.warn("Failed to get signals, using mock data");
    return getMockSignals();
  }
}

// ============================================
// MOCK SIGNALS
// ============================================

function getMockSignals(): Record<string, ExecutiveSignals> {
  const signals: Record<string, ExecutiveSignals> = {};

  // Count mock decisions
  for (const d of mockDecisions) {
    if (d.status === "Pending" || d.status === "InfoRequested") {
      if (!signals[d.project_id]) {
        signals[d.project_id] = {
          pendingDecisions: 0,
          openNeeds: 0,
          nextMilestone: null,
          ownerAvatar: null,
          ownerName: null,
        };
      }
      signals[d.project_id].pendingDecisions++;
    }
  }

  // Count mock needs
  for (const n of mockNeeds) {
    if (n.status === "Open" || n.status === "InReview") {
      if (!signals[n.project_id]) {
        signals[n.project_id] = {
          pendingDecisions: 0,
          openNeeds: 0,
          nextMilestone: null,
          ownerAvatar: null,
          ownerName: null,
        };
      }
      signals[n.project_id].openNeeds++;
    }
  }

  // Find mock milestones
  const now = new Date();
  const seenProjects = new Set<string>();
  const sortedMilestones = [...mockMilestones]
    .filter((m) => m.status !== "completed" && m.target_date && new Date(m.target_date) > now)
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());

  for (const m of sortedMilestones) {
    if (!seenProjects.has(m.project_id) && m.target_date) {
      seenProjects.add(m.project_id);
      if (!signals[m.project_id]) {
        signals[m.project_id] = {
          pendingDecisions: 0,
          openNeeds: 0,
          nextMilestone: null,
          ownerAvatar: null,
          ownerName: null,
        };
      }
      signals[m.project_id].nextMilestone = {
        title: m.title,
        dueDate: m.target_date,
      };
    }
  }

  return signals;
}
