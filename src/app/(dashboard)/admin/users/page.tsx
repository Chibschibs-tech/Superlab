import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UsersManagement } from "./users-management";
import type { UserRole } from "@/types";

// Admin roles that can access this page
const ADMIN_ROLES: UserRole[] = ["Owner", "Admin", "LabAdmin"];

async function getCurrentUser() {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return profile;
}

async function getAllUsers() {
  const supabase = await createClient();
  
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return users;
}

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-xl bg-white/5"
        />
      ))}
    </div>
  );
}

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  
  // Check if user has admin access
  if (!currentUser || !ADMIN_ROLES.includes(currentUser.role as UserRole)) {
    redirect("/showroom");
  }

  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Gestion des utilisateurs
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Gérez les utilisateurs et leurs rôles sur la plateforme
        </p>
      </div>

      {/* Users List */}
      <Suspense fallback={<UsersSkeleton />}>
        <UsersManagement 
          users={users} 
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role as UserRole}
        />
      </Suspense>
    </div>
  );
}

