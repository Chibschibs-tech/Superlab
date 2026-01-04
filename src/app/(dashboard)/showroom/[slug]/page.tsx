import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectBySlug } from "@/lib/data/projects";
import { ProjectContent } from "./project-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectPitchPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/showroom"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au Showroom
        </Link>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
        >
          <Link href={`/lab/${slug}/edit`}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Éditer
          </Link>
        </Button>
      </div>

      {/* Project Content - Client Component with View Mode Logic */}
      <ProjectContent project={project} />
    </div>
  );
}
