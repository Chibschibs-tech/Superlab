"use server";

import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectStatus, ProjectVisibility } from "@/types";
import { revalidatePath } from "next/cache";

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
    .replace(/^-|-$/g, "") // Trim dashes
    .substring(0, 50);
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
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Utilisateur non authentifié" };
    }

    // Generate base slug
    let baseSlug = generateSlug(input.title);
    if (!baseSlug) {
      baseSlug = `projet-${Date.now().toString(36)}`;
    }

    // Check for duplicate slug and make unique
    const { data: existingSlugs } = await supabase
      .from("projects")
      .select("slug")
      .like("slug", `${baseSlug}%`);

    let finalSlug = baseSlug;
    if (existingSlugs && existingSlugs.length > 0) {
      const existingSet = new Set(existingSlugs.map((p) => p.slug));
      if (existingSet.has(baseSlug)) {
        let counter = 1;
        while (existingSet.has(`${baseSlug}-${counter}`)) {
          counter++;
        }
        finalSlug = `${baseSlug}-${counter}`;
      }
    }

    // 1. Insert project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        title: input.title,
        slug: finalSlug,
        description: input.description,
        category_id: input.category_id,
        status: input.status,
        visibility: input.visibility,
        tags: input.tags || [],
        thumbnail_url: input.thumbnail_url || null,
        owner_id: user.id,
        highlights: [],
        the_ask: null,
      })
      .select()
      .single();

    if (projectError) {
      console.error("Error creating project:", projectError);
      return { success: false, error: projectError.message };
    }

    // 2. Insert project_members row for creator as lead
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: "lead",
        added_by: user.id,
      });

    if (memberError) {
      console.warn("Error adding member (may already exist):", memberError.message);
    }

    // 3. Create initial "Projet créé" update
    const { error: updateError } = await supabase.from("updates").insert({
      project_id: project.id,
      user_id: user.id,
      content: "🚀 Projet créé dans l'incubateur",
      type: "General",
    });

    if (updateError) {
      console.warn("Error creating initial update:", updateError.message);
    }

    // Revalidate paths
    revalidatePath("/showroom");
    revalidatePath("/lab");

    return { success: true, slug: finalSlug };
  } catch (error) {
    console.error("Error creating project:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création du projet",
    };
  }
}

// ============================================
// APPROVE PROJECT
// ============================================

export async function approveProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("projects")
      .update({
        status: "Supported",
        updated_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/showroom");
    revalidatePath("/decisions");

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
    const supabase = await createClient();

    const { error } = await supabase
      .from("projects")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/showroom");
    revalidatePath("/lab");

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
    const supabase = await createClient();

    const { error } = await supabase.from("projects").delete().eq("id", projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/showroom");
    revalidatePath("/lab");

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }
}
