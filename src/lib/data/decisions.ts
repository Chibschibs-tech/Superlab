import { createClient } from "@/lib/supabase/server";
import { mockDecisions, getMockProjectById } from "./mock-data";
import type { Decision, DecisionStatus } from "@/types";

export interface DecisionWithProject extends Decision {
  projects?: {
    title: string;
    slug: string;
  };
}

// ============================================
// GET DECISIONS
// ============================================

export async function getDecisions(
  filters?: {
    status?: DecisionStatus | "all";
  }
): Promise<DecisionWithProject[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("decisions")
      .select(`
        *,
        projects (
          title,
          slug
        )
      `)
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase error, using mock data:", error.message);
      return getMockDecisions(filters);
    }

    return data as DecisionWithProject[];
  } catch (error) {
    console.warn("Failed to connect to Supabase, using mock data");
    return getMockDecisions(filters);
  }
}

function getMockDecisions(
  filters?: {
    status?: DecisionStatus | "all";
  }
): DecisionWithProject[] {
  let result = [...mockDecisions];

  if (filters?.status && filters.status !== "all") {
    result = result.filter((d) => d.status === filters.status);
  }

  return result.map((d) => {
    const project = getMockProjectById(d.project_id);
    return {
      ...d,
      projects: project
        ? { title: project.title, slug: project.slug }
        : undefined,
    };
  });
}

// ============================================
// GET PENDING DECISIONS COUNT BY PROJECT
// ============================================

export async function getPendingDecisionsCountByProject(): Promise<
  Record<string, number>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("decisions")
      .select("project_id")
      .in("status", ["Pending", "InfoRequested"]);

    if (error) {
      console.warn("Error fetching decisions count:", error.message);
      return getMockPendingDecisionsCount();
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.project_id] = (counts[row.project_id] || 0) + 1;
    }
    return counts;
  } catch {
    return getMockPendingDecisionsCount();
  }
}

function getMockPendingDecisionsCount(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const decision of mockDecisions) {
    if (decision.status === "Pending" || decision.status === "InfoRequested") {
      counts[decision.project_id] = (counts[decision.project_id] || 0) + 1;
    }
  }
  return counts;
}

// ============================================
// GET DECISION BY ID
// ============================================

export async function getDecisionById(
  decisionId: string
): Promise<DecisionWithProject | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("decisions")
      .select(`
        *,
        projects (
          title,
          slug
        )
      `)
      .eq("id", decisionId)
      .single();

    if (error) {
      console.warn("Error fetching decision:", error.message);
      const mock = mockDecisions.find((d) => d.id === decisionId);
      if (mock) {
        const project = getMockProjectById(mock.project_id);
        return {
          ...mock,
          projects: project
            ? { title: project.title, slug: project.slug }
            : undefined,
        };
      }
      return null;
    }

    return data as DecisionWithProject;
  } catch {
    const mock = mockDecisions.find((d) => d.id === decisionId);
    if (mock) {
      const project = getMockProjectById(mock.project_id);
      return {
        ...mock,
        projects: project
          ? { title: project.title, slug: project.slug }
          : undefined,
      };
    }
    return null;
  }
}
