"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProjectAsset, AssetType } from "@/types";

export interface AssetFormData {
  name: string;
  description?: string;
  type: AssetType;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  is_public?: boolean;
  is_featured?: boolean;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getAssets(projectId: string): Promise<ProjectAsset[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("project_assets")
    .select("*")
    .eq("project_id", projectId)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching assets:", error);
    return [];
  }

  return data as ProjectAsset[];
}

export async function getFeaturedAssets(projectId: string): Promise<ProjectAsset[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("project_assets")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching featured assets:", error);
    return [];
  }

  return data as ProjectAsset[];
}

export async function createAsset(
  projectId: string,
  formData: AssetFormData
): Promise<ActionResult<ProjectAsset>> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  const uploadedBy = user?.id || "00000000-0000-0000-0000-000000000000";

  const { data, error } = await supabase
    .from("project_assets")
    .insert({
      project_id: projectId,
      uploaded_by: uploadedBy,
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      file_url: formData.file_url,
      file_size: formData.file_size || null,
      mime_type: formData.mime_type || null,
      is_public: formData.is_public || false,
      is_featured: formData.is_featured || false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating asset:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true, data: data as ProjectAsset };
}

export async function updateAsset(
  assetId: string,
  formData: Partial<AssetFormData>
): Promise<ActionResult<ProjectAsset>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_assets")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .select()
    .single();

  if (error) {
    console.error("Error updating asset:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true, data: data as ProjectAsset };
}

export async function deleteAsset(assetId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_assets")
    .delete()
    .eq("id", assetId);

  if (error) {
    console.error("Error deleting asset:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/lab/[slug]`, "page");
  return { success: true };
}

export async function toggleAssetFeatured(
  assetId: string,
  isFeatured: boolean
): Promise<ActionResult<ProjectAsset>> {
  return updateAsset(assetId, { is_featured: isFeatured });
}

export async function toggleAssetPublic(
  assetId: string,
  isPublic: boolean
): Promise<ActionResult<ProjectAsset>> {
  return updateAsset(assetId, { is_public: isPublic });
}

