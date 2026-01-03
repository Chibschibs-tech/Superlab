import { CircleCheckBig, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DecisionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <CircleCheckBig className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Decisions</h1>
          <p className="text-sm text-muted-foreground">
            Pending approvals and resource requests
          </p>
        </div>
      </div>

      {/* Placeholder Decision Cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-500">
                  Pending
                </span>
              </div>
              <h3 className="font-semibold">Sample Decision {i + 1}</h3>
              <p className="text-sm text-muted-foreground">
                Request for additional resources
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Reject
              </Button>
              <Button size="sm">Approve</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

