"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getMockProjectBySlug } from "@/lib/data/mock-data";
import type { 
  Project, 
  ProjectAsset, 
  Milestone, 
  Task,
  MilestoneStatus,
  TaskStatus,
  TaskPriority,
  AssetType
} from "@/types";

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

// ============================================
// RESULT TYPES
// ============================================

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// PROJECT ACTIONS
// ============================================

export async function updateProjectOverview(
  projectId: string,
  description: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("projects")
      .update({ description, last_updated_at: new Date().toISOString() })
      .eq("id", projectId);

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    revalidatePath(`/showroom/[slug]`, "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to update project overview:", error);
    return { success: false, error: "Échec de la mise à jour" };
  }
}

export async function updateProjectHighlights(
  projectId: string,
  highlights: string | string[]
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    // Convert to array if string (for backwards compatibility)
    const highlightsArray = Array.isArray(highlights) 
      ? highlights 
      : highlights.split("\n").filter(Boolean);
    
    const { error } = await supabase
      .from("projects")
      .update({ highlights: highlightsArray, last_updated_at: new Date().toISOString() })
      .eq("id", projectId);

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    revalidatePath(`/showroom/[slug]`, "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to update highlights:", error);
    return { success: false, error: "Échec de la mise à jour des highlights" };
  }
}

export async function updateProjectTheAsk(
  projectId: string,
  theAsk: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("projects")
      .update({ the_ask: theAsk, last_updated_at: new Date().toISOString() })
      .eq("id", projectId);

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    revalidatePath(`/showroom/[slug]`, "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to update the ask:", error);
    return { success: false, error: "Échec de la mise à jour" };
  }
}

// ============================================
// ASSET ACTIONS
// ============================================

interface CreateAssetInput {
  project_id: string;
  name: string;
  description?: string;
  type: AssetType;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  is_public?: boolean;
  is_featured?: boolean;
  is_pinned?: boolean;
  tags?: string[];
}

export async function createAsset(
  input: CreateAssetInput
): Promise<ActionResult<ProjectAsset>> {
  try {
    const supabase = await createClient();
    
    // Get current user for uploaded_by
    const { data: { user } } = await supabase.auth.getUser();
    const uploadedBy = user?.id || "00000000-0000-0000-0000-000000000001"; // Fallback for dev
    
    const { data, error } = await supabase
      .from("project_assets")
      .insert({
        ...input,
        uploaded_by: uploadedBy,
        is_public: input.is_public ?? false,
        is_featured: input.is_featured ?? false,
        is_pinned: input.is_pinned ?? false,
        tags: input.tags ?? [],
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    return { success: true, data: data as ProjectAsset };
  } catch (error: any) {
    console.error("Failed to create asset:", error);
    const errorMessage = error?.message || error?.code || "Échec de l'upload";
    return { success: false, error: `Échec de l'upload: ${errorMessage}` };
  }
}

export async function updateAsset(
  assetId: string,
  updates: Partial<Pick<ProjectAsset, "name" | "description" | "is_public" | "is_featured" | "is_pinned" | "tags">>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("project_assets")
      .update(updates)
      .eq("id", assetId);

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to update asset:", error);
    return { success: false, error: "Échec de la mise à jour" };
  }
}

export async function deleteAsset(assetId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("project_assets")
      .delete()
      .eq("id", assetId);

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete asset:", error);
    return { success: false, error: "Échec de la suppression" };
  }
}

// ============================================
// MILESTONE ACTIONS
// ============================================

interface CreateMilestoneInput {
  project_id: string;
  title: string;
  description?: string;
  target_date: string;
  start_date?: string;
  status?: MilestoneStatus;
}

export async function createMilestone(
  input: CreateMilestoneInput
): Promise<ActionResult<Milestone>> {
  try {
    const supabase = await createClient();
    
    // Get max sort_order
    const { data: existing } = await supabase
      .from("milestones")
      .select("sort_order")
      .eq("project_id", input.project_id)
      .order("sort_order", { ascending: false })
      .limit(1);
    
    const sortOrder = existing?.[0]?.sort_order ? existing[0].sort_order + 1 : 0;
    
    // Note: DB uses due_date and progress, TS uses target_date and progress_percent
    const { data, error } = await supabase
      .from("milestones")
      .insert({
        project_id: input.project_id,
        title: input.title,
        description: input.description || null,
        due_date: input.target_date, // Map to DB column
        start_date: input.start_date || null,
        status: input.status ?? "Planned", // DB uses capitalized enum
        sort_order: sortOrder,
        progress: 0, // DB uses progress, not progress_percent
      })
      .select()
      .single();

    if (error) throw error;

    // Map DB response back to TS interface
    const milestone: Milestone = {
      ...data,
      target_date: data.due_date,
      progress_percent: data.progress,
    };

    revalidatePath(`/lab/[slug]/edit`, "page");
    return { success: true, data: milestone };
  } catch (error: any) {
    console.error("Failed to create milestone:", error);
    return { success: false, error: error?.message || "Échec de la création" };
  }
}

export async function updateMilestone(
  milestoneId: string,
  updates: Partial<Pick<Milestone, "title" | "description" | "status" | "target_date" | "start_date" | "completed_date" | "progress_percent" | "sort_order">>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    // Map TS field names to DB column names
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) {
      // DB uses capitalized status
      const statusMap: Record<string, string> = {
        planned: "Planned",
        in_progress: "InProgress",
        completed: "Completed",
        delayed: "Delayed",
        cancelled: "Cancelled",
      };
      dbUpdates.status = statusMap[updates.status] || updates.status;
    }
    if (updates.target_date !== undefined) dbUpdates.due_date = updates.target_date;
    if (updates.start_date !== undefined) dbUpdates.start_date = updates.start_date;
    if (updates.completed_date !== undefined) dbUpdates.completed_date = updates.completed_date;
    if (updates.progress_percent !== undefined) dbUpdates.progress = updates.progress_percent;
    if (updates.sort_order !== undefined) dbUpdates.sort_order = updates.sort_order;
    
    const { error } = await supabase
      .from("milestones")
      .update(dbUpdates)
      .eq("id", milestoneId);

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update milestone:", error);
    return { success: false, error: error?.message || "Échec de la mise à jour" };
  }
}

export async function deleteMilestone(milestoneId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("milestones")
      .delete()
      .eq("id", milestoneId);

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete milestone:", error);
    return { success: false, error: "Échec de la suppression" };
  }
}

// ============================================
// TASK ACTIONS
// ============================================

interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  milestone_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
  estimated_hours?: number;
}

export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<Task>> {
  try {
    const supabase = await createClient();
    
    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser();
    const createdBy = user?.id || "00000000-0000-0000-0000-000000000001";
    
    // Get max sort_order
    const { data: existing } = await supabase
      .from("tasks")
      .select("sort_order")
      .eq("project_id", input.project_id)
      .order("sort_order", { ascending: false })
      .limit(1);
    
    const sortOrder = existing?.[0]?.sort_order ? existing[0].sort_order + 1 : 0;
    
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...input,
        created_by: createdBy,
        status: input.status ?? "backlog",
        priority: input.priority ?? "medium",
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    return { success: true, data: data as Task };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Échec de la création" };
  }
}

export async function updateTask(
  taskId: string,
  updates: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "milestone_id" | "assignee_id" | "due_date" | "estimated_hours" | "actual_hours" | "completed_at" | "sort_order">>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    // Auto-set completed_at when status changes to done
    if (updates.status === "done" && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { success: false, error: "Échec de la mise à jour" };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) throw error;

    revalidatePath(`/lab/[slug]/edit`, "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Échec de la suppression" };
  }
}

// ============================================
// DATA FETCHING
// ============================================

export async function getProjectForEditor(slug: string): Promise<ActionResult<{
  project: Project;
  assets: ProjectAsset[];
  milestones: Milestone[];
  tasks: Task[];
}>> {
  try {
    const supabase = await createClient();
    
    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .single();

    if (projectError) {
      // Fallback to mock data in development
      if (USE_MOCK_DATA) {
        const mockProject = getMockProjectBySlug(slug);
        if (mockProject) {
          return {
            success: true,
            data: {
              project: mockProject,
              assets: [],
              milestones: [],
              tasks: [],
            },
          };
        }
      }
      throw projectError;
    }

    // Fetch assets
    const { data: assets } = await supabase
      .from("project_assets")
      .select("*")
      .eq("project_id", project.id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    // Fetch milestones
    const { data: milestones } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });

    return {
      success: true,
      data: {
        project: project as Project,
        assets: (assets ?? []) as ProjectAsset[],
        milestones: (milestones ?? []) as Milestone[],
        tasks: (tasks ?? []) as Task[],
      },
    };
  } catch (error) {
    console.error("Failed to fetch project data:", error);
    
    // Final fallback to mock data
    if (USE_MOCK_DATA) {
      const mockProject = getMockProjectBySlug(slug);
      if (mockProject) {
        return {
          success: true,
          data: {
            project: mockProject,
            assets: [],
            milestones: [],
            tasks: [],
          },
        };
      }
    }
    
    return { success: false, error: "Projet introuvable" };
  }
}

