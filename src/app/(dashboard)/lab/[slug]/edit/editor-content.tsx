"use client";

import { useState } from "react";
import {
  FileText,
  Upload,
  Milestone as MilestoneIcon,
  ListTodo,
  DollarSign,
  Users,
  HelpCircle,
  CircleCheckBig,
  Clock,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  OverviewEditor,
  HighlightsEditor,
  MediaUploader,
  MilestoneManager,
  TaskManager,
} from "@/components/editor";
import { StakeholdersEditor } from "@/components/editor/stakeholders-editor";
import { NeedsEditor } from "@/components/editor/needs-editor";
import { DecisionsEditor } from "@/components/editor/decisions-editor";
import { UpdatesEditor } from "@/components/editor/updates-editor";
import { DiscussionEditor } from "@/components/editor/discussion-editor";
import { IdeasEditor } from "@/components/editor/ideas-editor";
import { updateProjectTheAsk } from "@/lib/actions/editor";
import type { Project, ProjectAsset, Milestone, Task, ProjectContact, Need, Decision, ProjectUpdate, Comment, Idea } from "@/types";

interface ProjectEditorContentProps {
  project: Project;
  assets: ProjectAsset[];
  milestones: Milestone[];
  tasks: Task[];
  contacts?: ProjectContact[];
  needs?: Need[];
  decisions?: Decision[];
  updates?: ProjectUpdate[];
  comments?: Comment[];
  ideas?: Idea[];
  currentUserId?: string;
}

export function ProjectEditorContent({
  project,
  assets,
  milestones,
  tasks,
  contacts = [],
  needs = [],
  decisions = [],
  updates = [],
  comments = [],
  ideas = [],
  currentUserId,
}: ProjectEditorContentProps) {
  return (
    <Tabs defaultValue="content" className="space-y-6">
      {/* Mobile-friendly Tab Navigation - Two rows */}
      <div className="space-y-2">
        <TabsList className="w-full h-auto flex-wrap gap-1 bg-white/[0.02] border border-white/10 p-1 rounded-xl">
          <TabsTrigger
            value="content"
            className="flex-1 min-w-[80px] data-[state=active]:bg-violet-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <FileText className="h-4 w-4 mr-1 hidden sm:block" />
            Contenu
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="flex-1 min-w-[80px] data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <Upload className="h-4 w-4 mr-1 hidden sm:block" />
            Médias
          </TabsTrigger>
          <TabsTrigger
            value="roadmap"
            className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <MilestoneIcon className="h-4 w-4 mr-1 hidden sm:block" />
            Roadmap
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="flex-1 min-w-[80px] data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <ListTodo className="h-4 w-4 mr-1 hidden sm:block" />
            Tâches
          </TabsTrigger>
        </TabsList>
        <TabsList className="w-full h-auto flex-wrap gap-1 bg-white/[0.02] border border-white/10 p-1 rounded-xl">
          <TabsTrigger
            value="stakeholders"
            className="flex-1 min-w-[80px] data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <Users className="h-4 w-4 mr-1 hidden sm:block" />
            Contacts
          </TabsTrigger>
          <TabsTrigger
            value="needs"
            className="flex-1 min-w-[80px] data-[state=active]:bg-rose-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <HelpCircle className="h-4 w-4 mr-1 hidden sm:block" />
            Besoins
          </TabsTrigger>
          <TabsTrigger
            value="decisions"
            className="flex-1 min-w-[80px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <CircleCheckBig className="h-4 w-4 mr-1 hidden sm:block" />
            Décisions
          </TabsTrigger>
          <TabsTrigger
            value="updates"
            className="flex-1 min-w-[80px] data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <Clock className="h-4 w-4 mr-1 hidden sm:block" />
            Updates
          </TabsTrigger>
        </TabsList>
        <TabsList className="w-full h-auto flex-wrap gap-1 bg-white/[0.02] border border-white/10 p-1 rounded-xl">
          <TabsTrigger
            value="discussion"
            className="flex-1 min-w-[100px] data-[state=active]:bg-pink-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <MessageSquare className="h-4 w-4 mr-1 hidden sm:block" />
            Discussion
          </TabsTrigger>
          <TabsTrigger
            value="ideas"
            className="flex-1 min-w-[100px] data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs sm:text-sm"
          >
            <Lightbulb className="h-4 w-4 mr-1 hidden sm:block" />
            Idées
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Content Tab */}
      <TabsContent value="content" className="space-y-6 mt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <OverviewEditor
              projectId={project.id}
              initialContent={project.description}
            />
            <HighlightsEditor
              projectId={project.id}
              initialHighlights={project.highlights}
            />
          </div>
          <div>
            <TheAskEditor
              projectId={project.id}
              initialTheAsk={project.the_ask}
            />
          </div>
        </div>
      </TabsContent>

      {/* Media Tab */}
      <TabsContent value="media" className="mt-0">
        <MediaUploader projectId={project.id} assets={assets} />
      </TabsContent>

      {/* Roadmap Tab */}
      <TabsContent value="roadmap" className="mt-0">
        <MilestoneManager
          projectId={project.id}
          milestones={milestones}
          tasks={tasks}
        />
      </TabsContent>

      {/* Tasks Tab */}
      <TabsContent value="tasks" className="mt-0">
        <TaskManager
          projectId={project.id}
          tasks={tasks}
          milestones={milestones}
        />
      </TabsContent>

      {/* Stakeholders Tab */}
      <TabsContent value="stakeholders" className="mt-0">
        <StakeholdersEditor
          projectId={project.id}
          contacts={contacts}
        />
      </TabsContent>

      {/* Needs Tab */}
      <TabsContent value="needs" className="mt-0">
        <NeedsEditor
          projectId={project.id}
          needs={needs}
          milestones={milestones}
        />
      </TabsContent>

      {/* Decisions Tab */}
      <TabsContent value="decisions" className="mt-0">
        <DecisionsEditor
          projectId={project.id}
          decisions={decisions}
        />
      </TabsContent>

      {/* Updates Tab */}
      <TabsContent value="updates" className="mt-0">
        <UpdatesEditor
          projectId={project.id}
          updates={updates}
        />
      </TabsContent>

      {/* Discussion Tab */}
      <TabsContent value="discussion" className="mt-0">
        <DiscussionEditor
          projectId={project.id}
          comments={comments}
          currentUserId={currentUserId}
        />
      </TabsContent>

      {/* Ideas Tab */}
      <TabsContent value="ideas" className="mt-0">
        <IdeasEditor
          projectId={project.id}
          ideas={ideas}
          currentUserId={currentUserId}
        />
      </TabsContent>
    </Tabs>
  );
}

// The Ask Editor Component
function TheAskEditor({
  projectId,
  initialTheAsk,
}: {
  projectId: string;
  initialTheAsk: string | null;
}) {
  const [theAsk, setTheAsk] = useState(initialTheAsk ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProjectTheAsk(projectId, theAsk);
    setIsSaving(false);

    if (result.success) {
      setIsSaved(true);
      toast.success("Demande enregistrée");
    } else {
      toast.error(result.error ?? "Erreur lors de la sauvegarde");
    }
  };

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-neutral-900 to-neutral-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-amber-400" />
            La Demande (The Ask)
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isSaved && (
              <span className="text-xs text-amber-400">Non enregistré</span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={cn(
                "h-8",
                isSaved
                  ? "bg-white/5 text-neutral-400"
                  : "bg-amber-600 hover:bg-amber-500 text-white"
              )}
            >
              {isSaving ? "..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={theAsk}
          onChange={(e) => {
            setTheAsk(e.target.value);
            setIsSaved(false);
          }}
          placeholder="Décrivez ce dont vous avez besoin : budget, ressources humaines, équipement, validation..."
          className={cn(
            "min-h-[180px] resize-y",
            "bg-white/[0.02] border-amber-500/20",
            "focus:border-amber-500/50 focus:ring-amber-500/20",
            "placeholder:text-neutral-500"
          )}
          aria-label="La demande du projet"
        />
        <p className="mt-2 text-xs text-neutral-500">
          Cette demande sera présentée au dirigeant dans le Showroom pour approbation.
        </p>
      </CardContent>
    </Card>
  );
}
