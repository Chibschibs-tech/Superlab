"use server";

import type { Project, ProjectStatus, ProjectVisibility } from "@/types";
import { mockProjects } from "@/lib/data/mock-data";

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

// ============================================
// UTILITY: Generate slug from title
// ============================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Remove consecutive dashes
    .trim();
}

// ============================================
// CREATE PROJECT
// ============================================

export interface CreateProjectInput {
  title: string;
  description: string | null;
  category_id: string | null;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  tags: string[];
  thumbnail_url?: string | null;
}

export async function createProject(
  input: CreateProjectInput
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    // Mock creator ID for demo
    const creatorId = "user-0001-0001-0001-000000000001";

    // Generate slug from title
    let baseSlug = generateSlug(input.title);
    if (!baseSlug) {
      baseSlug = `projet-${Date.now()}`;
    }

    if (USE_MOCK_DATA) {
      // Check for duplicate slug
      const existingSlug = mockProjects.find((p) => p.slug === baseSlug);
      const finalSlug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

      // Create mock project
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        title: input.title,
        slug: finalSlug,
        description: input.description,
        highlights: [],
        status: input.status,
        visibility: input.visibility,
        tags: input.tags,
        pitch_video_url: null,
        thumbnail_url: input.thumbnail_url || null,
        owner_id: creatorId,
        category_id: input.category_id,
        the_ask: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      };

      // Add to mock data (prepend so it shows first)
      mockProjects.unshift(newProject);

      return { success: true, slug: finalSlug };
    }

    // TODO: Implement Supabase insert
    // const { data: project, error } = await supabase
    //   .from("projects")
    //   .insert({
    //     title: input.title,
    //     slug: baseSlug,
    //     description: input.description,
    //     category_id: input.category_id,
    //     status: input.status,
    //     visibility: input.visibility,
    //     tags: input.tags,
    //     thumbnail_url: input.thumbnail_url,
    //     owner_id: creatorId,
    //   })
    //   .select()
    //   .single();

    // Also insert project_members row for creator as lead
    // const { error: memberError } = await supabase
    //   .from("project_members")
    //   .insert({
    //     project_id: project.id,
    //     user_id: creatorId,
    //     role: "lead",
    //   });

    return { success: false, error: "Supabase not configured" };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Erreur lors de la création du projet" };
  }
}

// ============================================
// APPROVE PROJECT
// ============================================

export async function approveProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (USE_MOCK_DATA) {
      const project = mockProjects.find((p) => p.id === projectId);
      if (project) {
        project.status = "Supported";
        project.updated_at = new Date().toISOString();
        project.last_updated_at = new Date().toISOString();
      }
      return { success: true };
    }

    // TODO: Implement Supabase update
    return { success: true };
  } catch (error) {
    console.error("Error approving project:", error);
    return { success: false, error: "Erreur lors de l'approbation" };
  }
}

// ============================================
// UPDATE PROJECT STATUS
// ============================================

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    if (USE_MOCK_DATA) {
      const project = mockProjects.find((p) => p.id === projectId);
      if (project) {
        project.status = status;
        project.updated_at = new Date().toISOString();
      }
      return { success: true };
    }

    // TODO: Implement Supabase update
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }
}

// ============================================
// DELETE PROJECT
// ============================================

export async function deleteProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (USE_MOCK_DATA) {
      const index = mockProjects.findIndex((p) => p.id === projectId);
      if (index !== -1) {
        mockProjects.splice(index, 1);
      }
      return { success: true };
    }

    // TODO: Implement Supabase delete
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }
}
