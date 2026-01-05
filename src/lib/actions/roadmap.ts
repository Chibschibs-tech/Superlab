"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MilestoneStatus, TaskStatus, TaskPriority } from "@/types";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// MILESTONE ACTIONS
// ============================================

export async function updateMilestoneDates(
  milestoneId: string,
  startDate: string | null,
  endDate: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("milestones")
    .update({
      start_date: startDate,
      target_date: endDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);

  if (error) {
    console.error("Error updating milestone dates:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/lab/[slug]/edit", "page");
  return { success: true };
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus,
  progressPercent?: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (progressPercent !== undefined) {
    updates.progress_percent = progressPercent;
  }

  if (status === "completed") {
    updates.completed_date = new Date().toISOString().split("T")[0];
    updates.progress_percent = 100;
  }

  const { error } = await supabase
    .from("milestones")
    .update(updates)
    .eq("id", milestoneId);

  if (error) {
    console.error("Error updating milestone status:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/lab/[slug]/edit", "page");
  return { success: true };
}

export async function reorderMilestones(
  milestoneIds: string[]
): Promise<ActionResult> {
  const supabase = await createClient();

  // Update order_index for each milestone
  for (let i = 0; i < milestoneIds.length; i++) {
    const { error } = await supabase
      .from("milestones")
      .update({ order_index: i })
      .eq("id", milestoneIds[i]);

    if (error) {
      console.error("Error reordering milestones:", error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/lab/[slug]/edit", "page");
  return { success: true };
}

// ============================================
// TASK ACTIONS
// ============================================

export async function updateTaskDates(
  taskId: string,
  startDate: string | null,
  dueDate: string | null
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({
      start_date: startDate,
      due_date: dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task dates:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/lab/[slug]/edit", "page");
  return { success: true };
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "done") {
    updates.completed_at = new Date().toISOString();
  } else {
    updates.completed_at = null;
  }

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task status:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/lab/[slug]/edit", "page");
  return { success: true };
}

export async function updateTaskAssignee(
  taskId: string,
  assigneeId: string | null
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({
      assignee_id: assigneeId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task assignee:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/lab/[slug]/edit", "page");
  return { success: true };
}

export async function createQuickTask(input: {
  project_id: string;
  milestone_id: string | null;
  title: string;
  start_date?: string;
  due_date?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Get next order_index
  const { data: lastTask } = await supabase
    .from("tasks")
    .select("order_index")
    .eq("project_id", input.project_id)
    .eq("milestone_id", input.milestone_id || null)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const orderIndex = (lastTask?.order_index || 0) + 1;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.project_id,
      milestone_id: input.milestone_id,
      title: input.title,
      start_date: input.start_date || null,
      due_date: input.due_date || null,
      status: input.status || "todo",
      priority: input.priority || "medium",
      created_by: user.id,
      order_index: orderIndex,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/lab/[slug]/edit", "page");
  return { success: true, data: { id: data.id } };
}

export async function createQuickMilestone(input: {
  project_id: string;
  title: string;
  start_date?: string;
  target_date: string;
  status?: MilestoneStatus;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  // Get next order_index
  const { data: lastMilestone } = await supabase
    .from("milestones")
    .select("order_index")
    .eq("project_id", input.project_id)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const orderIndex = (lastMilestone?.order_index || 0) + 1;

  const { data, error } = await supabase
    .from("milestones")
    .insert({
      project_id: input.project_id,
      title: input.title,
      start_date: input.start_date || null,
      target_date: input.target_date,
      status: input.status || "planned",
      order_index: orderIndex,
      progress_percent: 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating milestone:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/lab/[slug]/edit", "page");
  return { success: true, data: { id: data.id } };
}

// ============================================
// UPDATE ACTIONS (for Submit Update modal)
// ============================================

export async function createProjectUpdate(input: {
  project_id: string;
  content: string;
  type?: "Milestone" | "Blocker" | "General";
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const { data, error } = await supabase
    .from("updates")
    .insert({
      project_id: input.project_id,
      author_id: user.id,
      content: input.content,
      type: input.type || "General",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating update:", error);
    return { success: false, error: error.message };
  }

  // Update project's last_updated_at
  await supabase
    .from("projects")
    .update({ last_updated_at: new Date().toISOString() })
    .eq("id", input.project_id);

  revalidatePath("/lab/[slug]/edit", "page");
  return { success: true, data: { id: data.id } };
}

