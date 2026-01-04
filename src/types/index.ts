// ============================================
// USER TYPES
// ============================================

export type UserRole = "Owner" | "Admin" | "LabAdmin" | "Editor" | "Viewer";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// ============================================
// CATEGORY TYPES
// ============================================

export type CategoryType = "project" | "revenue";

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  description: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// PROJECT TYPES
// ============================================

export type ProjectStatus = "Idea" | "Validation" | "Scaling" | "Stalled" | "Supported";
export type ProjectVisibility = "Private" | "Org";

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  highlights: string[]; // JSONB array of key achievements
  highlights_text?: string | null; // Legacy TEXT field (deprecated)
  status: ProjectStatus;
  visibility: ProjectVisibility;
  tags: string[];
  pitch_video_url: string | null;
  thumbnail_url: string | null;
  owner_id: string;
  category_id: string | null;
  the_ask: string | null;
  created_at: string;
  updated_at: string;
  last_updated_at: string;
}

export interface ProjectWithCategory extends Project {
  category: Category | null;
}

// ============================================
// UPDATE TYPES
// ============================================

export type UpdateType = "Milestone" | "Blocker" | "General";

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  type: UpdateType;
  created_at: string;
}

// ============================================
// DECISION TYPES
// ============================================

export type DecisionStatus = "Pending" | "InfoRequested" | "Approved" | "Rejected";

export interface Decision {
  id: string;
  project_id: string;
  question: string;
  options: string[];
  status: DecisionStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// NEED TYPES (PRD first-class object)
// ============================================

export type NeedType = "Budget" | "Intro" | "Supplier" | "Legal" | "Hiring" | "Other";
export type NeedStatus = "Open" | "InReview" | "Fulfilled" | "Rejected";

export interface Need {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  type: NeedType;
  status: NeedStatus;
  urgency: number; // 1-5
  deadline: string | null;
  milestone_id: string | null;
  decision_id: string | null;
  created_by: string;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// ASSET TYPES
// ============================================

export type AssetType = 
  | "document"
  | "image"
  | "video"
  | "design"
  | "code"
  | "spreadsheet"
  | "other";

export interface ProjectAsset {
  id: string;
  project_id: string;
  uploaded_by: string;
  name: string;
  description: string | null;
  type: AssetType;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  is_public: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// MILESTONE TYPES
// ============================================

export type MilestoneStatus = 
  | "planned"
  | "in_progress"
  | "completed"
  | "delayed"
  | "cancelled";

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  start_date: string | null;
  target_date: string;
  completed_date: string | null;
  progress_percent: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// TASK TYPES
// ============================================

export type TaskStatus = 
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "blocked";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  depends_on: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// CONTACT TYPES
// ============================================

export type ContactType = 
  | "stakeholder"
  | "sponsor"
  | "partner"
  | "vendor"
  | "advisor"
  | "client";

export interface ProjectContact {
  id: string;
  project_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  type: ContactType;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// COMMITMENT TYPES
// ============================================

export type CommitmentType = 
  | "budget"
  | "headcount"
  | "equipment"
  | "time"
  | "other";

export type CommitmentStatus = 
  | "requested"
  | "approved"
  | "allocated"
  | "delivered"
  | "cancelled";

export interface Commitment {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  type: CommitmentType;
  status: CommitmentStatus;
  amount: number | null;
  currency: string;
  quantity: number | null;
  unit: string | null;
  requested_by: string;
  approved_by: string | null;
  requested_at: string;
  approved_at: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// EVENT TYPES
// ============================================

export type EventType = 
  | "meeting"
  | "review"
  | "demo"
  | "milestone"
  | "deadline"
  | "workshop"
  | "presentation";

export interface ProjectEvent {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  type: EventType;
  location: string | null;
  meeting_url: string | null;
  start_time: string;
  end_time: string | null;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_rule: string | null;
  organizer_id: string;
  attendees: string[];
  created_at: string;
  updated_at: string;
}

// ============================================
// PROJECT MEMBER TYPES
// ============================================

export type ProjectRole = "lead" | "editor" | "viewer";

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  added_at: string;
  added_by: string | null;
}

// ============================================
// JOINED/EXPANDED TYPES
// ============================================

export interface ProjectWithOwner extends Project {
  owner: User;
}

export interface TaskWithAssignee extends Task {
  assignee: User | null;
}

export interface MilestoneWithTasks extends Milestone {
  tasks: Task[];
}

export interface ProjectMemberWithUser extends ProjectMember {
  user: User;
}

export interface CommitmentWithUsers extends Commitment {
  requester: User;
  approver: User | null;
}

export interface ProjectEventWithOrganizer extends ProjectEvent {
  organizer: User;
}

export interface NeedWithProject extends Need {
  project: Project;
}

export interface NeedWithMilestone extends Need {
  milestone: Milestone | null;
}

export interface NeedWithDecision extends Need {
  decision: Decision | null;
}

// ============================================
// REVENUE COCKPIT TYPES
// ============================================

export type RevenueSourceType = "Manual" | "API" | "Webhook" | "CSV";
export type RevenueEntryType = "Sale" | "Refund" | "Subscription" | "AdRevenue" | "License" | "Other";
export type RevenueEntryStatus = "Pending" | "Confirmed" | "Cancelled";
export type SyncRunStatus = "Running" | "Success" | "Failed" | "Partial";

export interface RevenueStream {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  owner_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RevenueSource {
  id: string;
  name: string;
  type: RevenueSourceType;
  config_json: Record<string, unknown>;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueEntry {
  id: string;
  date: string;
  amount: number;
  currency: string;
  stream_id: string;
  source_id: string;
  entry_type: RevenueEntryType;
  status: RevenueEntryStatus;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueTarget {
  id: string;
  stream_id: string;
  month_date: string;
  target_amount: number;
  currency: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncRun {
  id: string;
  source_id: string;
  started_at: string;
  ended_at: string | null;
  status: SyncRunStatus;
  rows_imported: number;
  rows_skipped: number;
  rows_failed: number;
  error_log: string | null;
  initiated_by: string | null;
  metadata: Record<string, unknown>;
}

// Revenue with stream info
export interface RevenueEntryWithStream extends RevenueEntry {
  stream: RevenueStream;
}

// Revenue metrics for dashboard
export interface RevenueMetrics {
  today: number;
  wtd: number;  // Week to date
  mtd: number;  // Month to date
  ytd: number;  // Year to date
  runRate: number;  // Projected month-end based on current pace
  momChange: number;  // Month-over-month change percentage
  lastMonthTotal: number;
}

export interface StreamMetrics {
  stream: RevenueStream;
  mtdActual: number;
  mtdTarget: number;
  percentAchieved: number;
  trend: { date: string; amount: number }[];
}

export interface RiskMetrics {
  refundRate: number;
  refundCount: number;
  saleCount: number;
  streamsWithMissingData: { stream: RevenueStream; daysSinceLastEntry: number }[];
  pendingCount: number;
  cancelledCount: number;
}

export interface ForecastMetrics {
  runRateProjection: number;  // EOY projection
  mtdRemaining: number;       // Amount needed to hit MTD target
  daysRemainingInMonth: number;
  ytdActual: number;
  ytdTarget: number;
  gapToTarget: number;
}

