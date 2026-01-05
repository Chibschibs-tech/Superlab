"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Upload,
  Map,
  ListTodo,
  Users,
  HelpCircle,
  CircleCheckBig,
  Clock,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectHeader } from "./project-header";
import { GanttChart } from "./gantt-chart";
import { RoadmapDrawer } from "./roadmap-drawer";
import {
  OverviewEditor,
  HighlightsEditor,
  MediaUploader,
  TaskManager,
} from "@/components/editor";
import { StakeholdersEditor } from "@/components/editor/stakeholders-editor";
import { NeedsEditor } from "@/components/editor/needs-editor";
import { DecisionsEditor } from "@/components/editor/decisions-editor";
import { UpdatesEditor } from "@/components/editor/updates-editor";
import { DiscussionEditor } from "@/components/editor/discussion-editor";
import { IdeasEditor } from "@/components/editor/ideas-editor";
import { TheAskEditor } from "./the-ask-editor";
import { AddMilestoneDialog, AddTaskDialog } from "./quick-add-dialogs";
import type {
  Project,
  ProjectAsset,
  Milestone,
  Task,
  ProjectContact,
  Need,
  Decision,
  ProjectUpdate,
  Comment,
  Idea,
  ProjectKPIs,
  ProjectMemberWithUser,
  GanttData,
  GanttMilestone,
} from "@/types";

interface ProjectControlTowerProps {
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
  kpis: ProjectKPIs;
  team: ProjectMemberWithUser[];
  ganttData: GanttData;
  canEdit?: boolean;
  currentUserId?: string;
}

export function ProjectControlTower({
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
  kpis,
  team,
  ganttData,
  canEdit = false,
  currentUserId,
}: ProjectControlTowerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"milestone" | "task">("milestone");
  const [selectedItem, setSelectedItem] = useState<GanttMilestone | Task | null>(null);
  const [selectedParentMilestone, setSelectedParentMilestone] = useState<GanttMilestone | null>(null);
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addTaskMilestoneId, setAddTaskMilestoneId] = useState<string | null>(null);

  const handleMilestoneClick = useCallback((milestone: GanttMilestone) => {
    setDrawerType("milestone");
    setSelectedItem(milestone);
    setSelectedParentMilestone(null);
    setDrawerOpen(true);
  }, []);

  const handleTaskClick = useCallback((task: Task, milestone: GanttMilestone | null) => {
    setDrawerType("task");
    setSelectedItem(task);
    setSelectedParentMilestone(milestone);
    setDrawerOpen(true);
  }, []);

  const handleAddMilestone = useCallback(() => {
    setAddMilestoneOpen(true);
  }, []);

  const handleAddTask = useCallback((milestoneId: string | null) => {
    setAddTaskMilestoneId(milestoneId);
    setAddTaskOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedItem(null);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Project Header with KPIs */}
      <ProjectHeader project={project} kpis={kpis} team={team} canEdit={canEdit} />

      {/* Main Tabs */}
      <Tabs defaultValue="roadmap" className="space-y-4">
        {/* Tab Navigation */}
        <div className="space-y-2">
          <TabsList className="w-full h-auto flex-wrap gap-1 bg-white/[0.02] border border-white/10 p-1 rounded-xl">
            <TabsTrigger
              value="roadmap"
              className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs sm:text-sm"
            >
              <Map className="h-4 w-4 mr-1 hidden sm:block" />
              Roadmap
            </TabsTrigger>
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
        </div>

        {/* Roadmap Tab - Gantt View */}
        <TabsContent value="roadmap" className="mt-0">
          <div className="rounded-xl border border-white/10 bg-neutral-900/30 overflow-hidden" style={{ height: "calc(100vh - 420px)", minHeight: "400px" }}>
            <GanttChart
              data={ganttData}
              projectId={project.id}
              canEdit={canEdit}
              onMilestoneClick={handleMilestoneClick}
              onTaskClick={handleTaskClick}
              onAddMilestone={handleAddMilestone}
              onAddTask={handleAddTask}
            />
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6 mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <OverviewEditor projectId={project.id} initialContent={project.description} />
              <HighlightsEditor projectId={project.id} initialHighlights={project.highlights} />
            </div>
            <div>
              <TheAskEditor projectId={project.id} initialTheAsk={project.the_ask} />
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="mt-0">
          <MediaUploader projectId={project.id} assets={assets} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-0">
          <TaskManager projectId={project.id} tasks={tasks} milestones={milestones} />
        </TabsContent>

        {/* Stakeholders Tab */}
        <TabsContent value="stakeholders" className="mt-0">
          <StakeholdersEditor projectId={project.id} contacts={contacts} />
        </TabsContent>

        {/* Needs Tab */}
        <TabsContent value="needs" className="mt-0">
          <NeedsEditor projectId={project.id} needs={needs} milestones={milestones} />
        </TabsContent>

        {/* Decisions Tab */}
        <TabsContent value="decisions" className="mt-0">
          <DecisionsEditor projectId={project.id} decisions={decisions} />
        </TabsContent>

        {/* Updates Tab */}
        <TabsContent value="updates" className="mt-0">
          <UpdatesEditor projectId={project.id} updates={updates} />
        </TabsContent>
      </Tabs>

      {/* Drawer for editing milestone/task */}
      <RoadmapDrawer
        type={drawerType}
        item={selectedItem}
        parentMilestone={selectedParentMilestone}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        canEdit={canEdit}
        teamMembers={team}
      />

      {/* Quick Add Dialogs */}
      <AddMilestoneDialog
        projectId={project.id}
        isOpen={addMilestoneOpen}
        onClose={() => setAddMilestoneOpen(false)}
      />
      <AddTaskDialog
        projectId={project.id}
        milestoneId={addTaskMilestoneId}
        isOpen={addTaskOpen}
        onClose={() => {
          setAddTaskOpen(false);
          setAddTaskMilestoneId(null);
        }}
      />
    </div>
  );
}

