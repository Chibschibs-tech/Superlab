import { createClient } from "@/lib/supabase/server";
import { mockProjects, getMockProjectBySlug } from "./mock-data";
import type { Project } from "@/types";

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

export async function getProjects(): Promise<Project[]> {
  // Try Supabase first
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
