"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DecisionStatus } from "@/types";

// ============================================
// UPDATE DECISION STATUS
// ============================================

export async function updateDecisionStatus(
  decisionId: string,
  status: DecisionStatus,
  selectedOption?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (selectedOption) {
      updateData.selected_option = selectedOption;
    }

    if (status === "Approved" || status === "Rejected") {
      updateData.decided_by = user.id;
      updateData.decided_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("decisions")
      .update(updateData)
      .eq("id", decisionId);

    if (error) {
      console.error("Error updating decision:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/decisions");
    revalidatePath("/showroom");

    return { success: true };
  } catch (error) {
    console.error("Error updating decision:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// ============================================
// APPROVE DECISION
// ============================================

export async function approveDecision(
  decisionId: string,
  selectedOption?: string
): Promise<{ success: boolean; error?: string }> {
  return updateDecisionStatus(decisionId, "Approved", selectedOption);
}

// ============================================
// REJECT DECISION
// ============================================

export async function rejectDecision(
  decisionId: string
): Promise<{ success: boolean; error?: string }> {
  return updateDecisionStatus(decisionId, "Rejected");
}

// ============================================
// REQUEST MORE INFO
// ============================================

export async function requestDecisionInfo(
  decisionId: string
): Promise<{ success: boolean; error?: string }> {
  return updateDecisionStatus(decisionId, "InfoRequested");
}

// ============================================
// CREATE DECISION
// ============================================

export async function createDecision(
  projectId: string,
  question: string,
  options: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    const { error } = await supabase.from("decisions").insert({
      project_id: projectId,
      question,
      options,
      status: "Pending",
      requested_by: user.id,
    });

    if (error) {
      console.error("Error creating decision:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/decisions");
    revalidatePath(`/showroom`);

    return { success: true };
  } catch (error) {
    console.error("Error creating decision:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

