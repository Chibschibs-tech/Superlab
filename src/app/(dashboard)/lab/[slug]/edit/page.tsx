import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectForEditor } from "@/lib/actions/editor";
import { getRoadmapData, getProjectKPIs, getProjectTeam } from "@/lib/data/roadmap";
import { ProjectControlTower } from "@/components/project";
import { createClient } from "@/lib/supabase/server";
import type { GanttData, ProjectKPIs, ProjectMemberWithUser } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectEditorPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getProjectForEditor(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const { project, assets, milestones, tasks } = result.data;

  // Fetch additional data for Control Tower
  const [ganttData, kpis, team] = await Promise.all([
    getRoadmapData(project.id),
    getProjectKPIs(project.id),
    getProjectTeam(project.id),
  ]);

  // Get current user for edit permissions
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user can edit (is team member with lead/editor role, or is admin)
  const { data: currentUserProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.id || "")
    .single();

  const isAdmin = ["Owner", "Admin", "LabAdmin"].includes(currentUserProfile?.role || "");
  const isTeamMember = team.some(
    (m) => m.user_id === user?.id && ["lead", "editor"].includes(m.role)
  );
  const canEdit = isAdmin || isTeamMember;

  // Default gantt data if none
  const defaultGanttData: GanttData = {
    milestones: milestones.map((m) => ({ ...m, tasks: tasks.filter((t) => t.milestone_id === m.id) })),
    unassignedTasks: tasks.filter((t) => !t.milestone_id),
    dateRange: {
      start: new Date().toISOString().split("T")[0],
      end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/lab" className="text-neutral-500 hover:text-white transition-colors">
          Lab
        </Link>
        <span className="text-neutral-600">/</span>
        <Link href={`/showroom/${slug}`} className="text-neutral-500 hover:text-white transition-colors">
          {project.title}
        </Link>
        <span className="text-neutral-600">/</span>
        <span className="text-neutral-400">Control Tower</span>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
        >
          <Link href={`/showroom/${slug}`}>
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Showroom
          </Link>
        </Button>
      </div>

      {/* Control Tower */}
      <ProjectControlTower
        project={project}
        assets={assets}
        milestones={milestones}
        tasks={tasks}
        kpis={kpis}
        team={team}
        ganttData={ganttData || defaultGanttData}
        canEdit={canEdit}
        currentUserId={user?.id}
      />
    </div>
  );
}


