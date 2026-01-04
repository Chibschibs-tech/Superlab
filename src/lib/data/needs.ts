import { createClient } from "@/lib/supabase/server";
import type { Need, NeedStatus, NeedType } from "@/types";

// ============================================
// MOCK NEEDS DATA
// ============================================

const mockNeeds: Need[] = [
  {
    id: "need-001",
    project_id: "11111111-1111-1111-1111-111111111111",
    title: "Budget pour 2 ML Engineers",
    description: "Recrutement de 2 ingénieurs ML pour accélérer le développement de l'agent IA",
    type: "Hiring",
    status: "Open",
    urgency: 5,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    requested_by: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "need-002",
    project_id: "22222222-2222-2222-2222-222222222222",
    title: "Introduction au distributeur Thomann",
    description: "Besoin d'une mise en relation avec l'équipe e-commerce de Thomann",
    type: "Intro",
    status: "InReview",
    urgency: 4,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    requested_by: "e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f70",
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "need-003",
    project_id: "33333333-3333-3333-3333-333333333333",
    title: "Validation contrat fournisseur Chine",
    description: "Revue juridique du contrat avec le nouveau fournisseur",
    type: "Legal",
    status: "Open",
    urgency: 4,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    requested_by: "f2f76d50-0d3c-6b7e-1e7f-3c4d5e6f7081",
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "need-004",
    project_id: "44444444-4444-4444-4444-444444444444",
    title: "Budget infrastructure cloud",
    description: "25K€ pour scaling infrastructure Azure",
    type: "Budget",
    status: "Open",
    urgency: 5,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    requested_by: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "need-005",
    project_id: "55555555-5555-5555-5555-555555555555",
    title: "Sélection prestataire événementiel",
    description: "Besoin d'aide pour choisir le partenaire pour les événements Q2",
    type: "Supplier",
    status: "Fulfilled",
    urgency: 3,
    deadline: null,
    requested_by: "e1e65c4f-9c2b-5a6d-0d6e-2b3c4d5e6f70",
    fulfilled_by: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    fulfilled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock project mapping for display
const mockProjectMap: Record<string, { title: string; slug: string }> = {
  "11111111-1111-1111-1111-111111111111": {
    title: "Supermedia AI Agent",
    slug: "supermedia-ai-agent",
  },
  "22222222-2222-2222-2222-222222222222": {
    title: "Pro Audio Marketplace",
    slug: "pro-audio-marketplace",
  },
  "33333333-3333-3333-3333-333333333333": {
    title: "AV Rental Platform",
    slug: "av-rental-platform",
  },
  "44444444-4444-4444-4444-444444444444": {
    title: "Retail Analytics Hub",
    slug: "retail-analytics-hub",
  },
  "55555555-5555-5555-5555-555555555555": {
    title: "Event Tech Suite",
    slug: "event-tech-suite",
  },
};

// ============================================
// TYPES
// ============================================

export interface NeedWithProject extends Need {
  projects?: {
    title: string;
    slug: string;
  };
}

// ============================================
// GET NEEDS
// ============================================

export async function getNeeds(
  filters?: {
    status?: NeedStatus | "all";
    type?: NeedType | "all";
    urgency?: number | "all";
  }
): Promise<NeedWithProject[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("needs")
      .select(
        `
        *,
        projects (
          title,
          slug
        )
      `
      )
      .order("urgency", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }
    if (filters?.urgency && filters.urgency !== "all") {
      query = query.gte("urgency", filters.urgency);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Supabase error fetching needs, using mock:", error.message);
      return getMockNeeds(filters);
    }

    return data as NeedWithProject[];
  } catch (error) {
    console.warn("Failed to fetch needs, using mock data");
    return getMockNeeds(filters);
  }
}

function getMockNeeds(
  filters?: {
    status?: NeedStatus | "all";
    type?: NeedType | "all";
    urgency?: number | "all";
  }
): NeedWithProject[] {
  let result = [...mockNeeds];

  if (filters?.status && filters.status !== "all") {
    result = result.filter((n) => n.status === filters.status);
  }
  if (filters?.type && filters.type !== "all") {
    result = result.filter((n) => n.type === filters.type);
  }
  if (filters?.urgency && filters.urgency !== "all") {
    const minUrgency = filters.urgency as number;
    result = result.filter((n) => n.urgency >= minUrgency);
  }

  return result.map((n) => ({
    ...n,
    projects: mockProjectMap[n.project_id],
  }));
}

// ============================================
// GET OPEN NEEDS COUNT BY PROJECT
// ============================================

export async function getOpenNeedsCountByProject(): Promise<
  Record<string, number>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("needs")
      .select("project_id")
      .in("status", ["Open", "InReview"]);

    if (error) {
      console.warn("Error fetching needs count:", error.message);
      return getMockOpenNeedsCount();
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.project_id] = (counts[row.project_id] || 0) + 1;
    }
    return counts;
  } catch {
    return getMockOpenNeedsCount();
  }
}

function getMockOpenNeedsCount(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const need of mockNeeds) {
    if (need.status === "Open" || need.status === "InReview") {
      counts[need.project_id] = (counts[need.project_id] || 0) + 1;
    }
  }
  return counts;
}

