export type UserRole = "Owner" | "Admin" | "Viewer";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = "Idea" | "Validation" | "Scaling" | "Stalled";

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  pitch_video_url: string | null;
  thumbnail_url: string | null;
  owner_id: string;
  the_ask: string | null;
  created_at: string;
  updated_at: string;
  last_updated_at: string;
}

export type UpdateType = "Milestone" | "Blocker" | "General";

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  type: UpdateType;
  created_at: string;
}

export type DecisionStatus = "Pending" | "Approved" | "Rejected";

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

