"use server";

import type { Project, ProjectStatus, ProjectVisibility } from "@/types";

// ============================================
// PROJECT CREATION TYPES
// ============================================

export interface CreateProjectInput {
  title: string;
  one_liner: string;
  category_id: string | null;
  stage: ProjectStatus;
  visibility: ProjectVisibility;
  hero_asset_url: string | null;
  tags: string[];
}

export interface CreateProjectResult {
  success: boolean;
  project?: Project;
  error?: string;
}

// ============================================
// SLUG GENERATION
// ============================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

// ============================================
// CREATE PROJECT ACTION
// ============================================

export async function createProject(
  input: CreateProjectInput,
  creatorId: string
): Promise<CreateProjectResult> {
  try {
    // Generate slug from title
    const baseSlug = generateSlug(input.title);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // TODO: Replace with actual Supabase insert
    // For now, simulate creation
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: input.title,
      slug,
      description: input.one_liner,
      highlights: [],
      status: input.stage,
      visibility: input.visibility,
      tags: input.tags,
      pitch_video_url: null,
      thumbnail_url: input.hero_asset_url,
      owner_id: creatorId,
      category_id: input.category_id,
      the_ask: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
    };

    // In real implementation:
    // 1. Insert project
    // const { data: projectData, error: projectError } = await supabase
    //   .from('projects')
    //   .insert({
    //     title: input.title,
    //     slug,
    //     description: input.one_liner,
    //     status: input.stage,
    //     visibility: input.visibility,
    //     tags: input.tags,
    //     thumbnail_url: input.hero_asset_url,
    //     owner_id: creatorId,
    //     category_id: input.category_id,
    //   })
    //   .select()
    //   .single();

    // 2. Insert project_members row for creator as lead
    // const { error: memberError } = await supabase
    //   .from('project_members')
    //   .insert({
    //     project_id: projectData.id,
    //     user_id: creatorId,
    //     role: 'lead',
    //     added_by: creatorId,
    //   });

    console.log("[Create Project] Created:", newProject.slug);

    return {
      success: true,
      project: newProject,
    };
  } catch (error) {
    console.error("[Create Project] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ============================================
// CHECK SLUG AVAILABILITY
// ============================================

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  // TODO: Implement actual Supabase check
  // const { data } = await supabase
  //   .from('projects')
  //   .select('id')
  //   .eq('slug', slug)
  //   .single();
  // return !data;
  
  return true; // Mock: always available
}

