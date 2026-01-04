import { AppLayout } from "@/components/layout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@/types";

async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    return null;
  }

  // Fetch user profile from users table
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profile) {
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      role: profile.role as UserRole,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      is_active: profile.is_active ?? true,
    };
  }

  // If no profile exists yet, create one with default Viewer role
  // This handles new signups
  const newUser: User = {
    id: authUser.id,
    email: authUser.email ?? "",
    full_name: authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0] ?? "User",
    avatar_url: authUser.user_metadata?.avatar_url ?? null,
    role: "Viewer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  };

  // Insert the new user profile
  await supabase.from("users").upsert({
    id: newUser.id,
    email: newUser.email,
    full_name: newUser.full_name,
    avatar_url: newUser.avatar_url,
    role: newUser.role,
  });

  return newUser;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  // If no user, redirect to login (middleware should handle this, but double-check)
  if (!user) {
    redirect("/login");
  }

  return <AppLayout user={user}>{children}</AppLayout>;
}
