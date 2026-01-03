import { FlaskConical } from "lucide-react";

export default function LabViewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lab View</h1>
          <p className="text-sm text-muted-foreground">
            Detailed project management and collaboration
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="rounded-xl border bg-card p-6">
        <p className="text-muted-foreground">
          Select a project to view roadmaps, files, and technical details.
        </p>
      </div>
    </div>
  );
}

