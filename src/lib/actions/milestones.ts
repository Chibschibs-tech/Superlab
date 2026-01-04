"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Milestone, MilestoneStatus } from "@/types";

export interface MilestoneFormData {
  title: string;
  description?: string;
  status: MilestoneStatus;
  start_date?: string;
  target_date: string;
  progress_percent?: number;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getMilestones(projectId: string): Promise<Milestone[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching milestones:", error);
    return [];
  }

  return data as Milestone[];
}

export async function createMilestone(
  projectId: string,
  formData: MilestoneFormData
): Promise<ActionResult<Milestone>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .insert({
      project_id: projectId,
      title: formData.title,
      description: formData.description || null,
      status: formData.status,
      start_date: formData.start_date || null,
      target_date: formData.target_date,
      progress_percent: formData.progress_percent || 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating milestone:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true, data: data as Milestone };
}

export async function updateMilestone(
  milestoneId: string,
  formData: Partial<MilestoneFormData>
): Promise<ActionResult<Milestone>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) {
    console.error("Error updating milestone:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true, data: data as Milestone };
}

export async function deleteMilestone(
  milestoneId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) {
    console.error("Error deleting milestone:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true };
}

export async function reorderMilestones(
  milestoneIds: string[]
): Promise<ActionResult> {
  const supabase = await createClient();

  const updates = milestoneIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from("milestones")
      .update({ sort_order: update.sort_order })
      .eq("id", update.id);

    if (error) {
      console.error("Error reordering milestone:", error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true };
}

