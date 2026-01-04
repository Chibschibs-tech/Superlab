import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectForEditor } from "@/lib/actions/editor";
import { ProjectEditorContent } from "./editor-content";

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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/showroom/${slug}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-neutral-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-violet-400" />
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Éditer le projet
              </h1>
            </div>
            <p className="text-sm text-neutral-400 mt-0.5">
              {project.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
          >
            <Link href={`/showroom/${slug}`}>
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Voir le Showroom
            </Link>
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <ProjectEditorContent
        project={project}
        assets={assets}
        milestones={milestones}
        tasks={tasks}
      />
    </div>
  );
}


