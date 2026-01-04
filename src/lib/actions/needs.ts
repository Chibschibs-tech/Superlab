"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { NeedStatus, NeedType } from "@/types";

// ============================================
// UPDATE NEED STATUS
// ============================================

export async function updateNeedStatus(
  needId: string,
  status: NeedStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    const { error } = await supabase
      .from("needs")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", needId);

    if (error) {
      console.error("Error updating need:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/needs");
    revalidatePath("/showroom");

    return { success: true };
  } catch (error) {
    console.error("Error updating need:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ============================================
// FULFILL NEED
// ============================================

export async function fulfillNeed(
  needId: string
): Promise<{ success: boolean; error?: string }> {
  return updateNeedStatus(needId, "Fulfilled");
}

// ============================================
// REJECT NEED
// ============================================

export async function rejectNeed(
  needId: string
): Promise<{ success: boolean; error?: string }> {
  return updateNeedStatus(needId, "Rejected");
}

// ============================================
// SET NEED IN REVIEW
// ============================================

export async function setNeedInReview(
  needId: string
): Promise<{ success: boolean; error?: string }> {
  return updateNeedStatus(needId, "InReview");
}

// ============================================
// CREATE NEED
// ============================================

export async function createNeed(
  projectId: string,
  data: {
    title: string;
    description?: string;
    type: NeedType;
    urgency?: number;
    deadline?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    const { error } = await supabase.from("needs").insert({
      project_id: projectId,
      title: data.title,
      description: data.description || null,
      type: data.type,
      status: "Open",
      urgency: data.urgency || 3,
      deadline: data.deadline || null,
      requested_by: user.id,
    });

    if (error) {
      console.error("Error creating need:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/needs");
    revalidatePath("/showroom");

    return { success: true };
  } catch (error) {
    console.error("Error creating need:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

