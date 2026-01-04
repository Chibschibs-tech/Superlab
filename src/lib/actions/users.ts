"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Admin roles that can manage users
const ADMIN_ROLES: UserRole[] = ["Owner", "Admin", "LabAdmin"];

async function checkAdminAccess(): Promise<{ isAdmin: boolean; currentRole?: UserRole; userId?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return { isAdmin: false };

  return {
    isAdmin: ADMIN_ROLES.includes(profile.role as UserRole),
    currentRole: profile.role as UserRole,
    userId: user.id,
  };
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) {
    return { success: false, error: "Accès non autorisé" };
  }

  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as UserRole || "Viewer";

  if (!email || !fullName || !password) {
    return { success: false, error: "Tous les champs sont requis" };
  }

  const supabase = await createClient();

  // Create auth user via Supabase Admin API
  // Note: This requires service_role key for admin operations
  // For now, we'll use signUp and then update the profile
  
  // First check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    return { success: false, error: "Un utilisateur avec cet email existe déjà" };
  }

  // Create auth user - this will trigger the handle_new_user function
  // which creates a profile in the users table
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm the email
    user_metadata: {
      full_name: fullName,
    },
  });

  if (authError) {
    console.error("Error creating auth user:", authError);
    
    // Fallback: Try regular signup if admin API not available
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signupError) {
      return { success: false, error: signupError.message };
    }

    if (signupData.user) {
      // Update the user profile with role
      const { error: updateError } = await supabase
        .from("users")
        .upsert({
          id: signupData.user.id,
          email,
          full_name: fullName,
          role,
        });

      if (updateError) {
        console.error("Error updating user profile:", updateError);
      }
    }
  } else if (authData.user) {
    // Update the user profile with the correct role
    const { error: updateError } = await supabase
      .from("users")
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
      });

    if (updateError) {
      console.error("Error updating user profile:", updateError);
    }
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<ActionResult> {
  const { isAdmin, currentRole, userId: currentUserId } = await checkAdminAccess();
  if (!isAdmin) {
    return { success: false, error: "Accès non autorisé" };
  }

  // Prevent changing own role
  if (userId === currentUserId) {
    return { success: false, error: "Vous ne pouvez pas modifier votre propre rôle" };
  }

  // Only Owner can assign Owner role
  if (newRole === "Owner" && currentRole !== "Owner") {
    return { success: false, error: "Seul un Propriétaire peut assigner le rôle Propriétaire" };
  }

  const supabase = await createClient();

  // Check target user's current role
  const { data: targetUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  // Only Owner can modify another Owner
  if (targetUser?.role === "Owner" && currentRole !== "Owner") {
    return { success: false, error: "Seul un Propriétaire peut modifier un autre Propriétaire" };
  }

  const { error } = await supabase
    .from("users")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
  const { isAdmin, userId: currentUserId } = await checkAdminAccess();
  if (!isAdmin) {
    return { success: false, error: "Accès non autorisé" };
  }

  // Prevent deactivating self
  if (userId === currentUserId) {
    return { success: false, error: "Vous ne pouvez pas vous désactiver vous-même" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("Error toggling user active:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role as UserRole | null;
}

