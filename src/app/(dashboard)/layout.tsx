import { AppLayout } from "@/components/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Fetch user from Supabase auth session
  // For now, passing null will default to "Viewer" role
  return <AppLayout user={null}>{children}</AppLayout>;
}

