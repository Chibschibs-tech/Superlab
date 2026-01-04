import { createClient } from "@/lib/supabase/server";
import { mockDecisions, getMockProjectById } from "./mock-data";
import type { Decision } from "@/types";

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

interface DecisionWithProject extends Decision {
  projects?: {
    title: string;
    slug: string;
  };
}

export async function getDecisions(): Promise<DecisionWithProject[]> {
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
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase error, using mock data:", error.message);
      if (USE_MOCK_DATA) {
        return mockDecisions.map((d) => {
          const project = getMockProjectById(d.project_id);
          return {
            ...d,
            projects: project
              ? { title: project.title, slug: project.slug }
              : undefined,
          };
        });
      }
      return [];
    }

    return data as DecisionWithProject[];
  } catch (error) {
    console.warn("Failed to connect to Supabase, using mock data");
    if (USE_MOCK_DATA) {
      return mockDecisions.map((d) => {
        const project = getMockProjectById(d.project_id);
        return {
          ...d,
          projects: project
            ? { title: project.title, slug: project.slug }
            : undefined,
        };
      });
    }
    return [];
  }
}

