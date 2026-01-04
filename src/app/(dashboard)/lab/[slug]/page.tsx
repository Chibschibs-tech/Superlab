import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProjectBySlug } from "@/lib/data/projects";
import { ProjectEditor } from "./project-editor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectEditorPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/lab"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Retour au Lab"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {project.title}
            </h1>
            <p className="text-sm text-neutral-400">
              Éditeur de projet • Mode Lab
            </p>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <ProjectEditor project={project} />
    </div>
  );
}

