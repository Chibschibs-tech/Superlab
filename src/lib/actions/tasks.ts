"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Task, TaskStatus, TaskPriority } from "@/types";

export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  milestone_id?: string;
  assignee_id?: string;
  due_date?: string;
  estimated_hours?: number;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return data as Task[];
}

export async function getTasksByMilestone(milestoneId: string): Promise<Task[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("milestone_id", milestoneId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return data as Task[];
}

export async function createTask(
  projectId: string,
  formData: TaskFormData
): Promise<ActionResult<Task>> {
  const supabase = await createClient();

  // Get current user for created_by field
  const { data: { user } } = await supabase.auth.getUser();
  const createdBy = user?.id || "00000000-0000-0000-0000-000000000000"; // Fallback for dev

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title: formData.title,
      description: formData.description || null,
      status: formData.status,
      priority: formData.priority,
      milestone_id: formData.milestone_id || null,
      assignee_id: formData.assignee_id || null,
      due_date: formData.due_date || null,
      estimated_hours: formData.estimated_hours || null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true, data: data as Task };
}

export async function updateTask(
  taskId: string,
  formData: Partial<TaskFormData>
): Promise<ActionResult<Task>> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    ...formData,
    updated_at: new Date().toISOString(),
  };

  // Set completed_at if status changed to done
  if (formData.status === "done") {
    updateData.completed_at = new Date().toISOString();
  } else if (formData.status) {
    // Status is set but not "done" - clear completed_at
    updateData.completed_at = null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true, data: data as Task };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true };
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult<Task>> {
  return updateTask(taskId, { status });
}

