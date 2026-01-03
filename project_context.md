# Project Context: Supermedia Lab

## 1. Project Vision
**"Supermedia Lab"** is not a standard project management tool. It is an **Internal Incubator Operating System** and **Showroom**. 
Its purpose is to transform internal projects from "email threads" into "living assets" that Top Management can view, evaluate, and support.

**The Core Philosophy:** - **Show, Don't Just Tell:** We prioritize visuals (video prototypes, designs) over text descriptions.
- **Investor Dashboard:** The "Owner" view behaves like an Angel Investor's portfolio (Pulse, Burn Rate, Key Decisions) rather than a task manager.
- **The "Lab" Feel:** A space for experimentation, where prototypes are embedded and accessible.

## 2. User Personas & Flows

### A. The Owner (Top Management)
* **Goal:** Quick decision-making (Go/No-Go), assessing the "Pulse" of the company, approving resources.
* **The Experience:**
    * **The Showroom:** A Netflix-style grid of projects with status badges.
    * **The Pitch Deck View:** When opening a project, they see the "Pitch" tab first (Hero Video, Value Prop, The "Ask").
    * **Action:** Single-click approvals for budgets or hiring.
    * **Authentication:** Magic Links (passwordless) for friction-free access.

### B. The Project Lead (Team)
* **Goal:** Organizing the chaos, reporting progress without "reporting," collaborating.
* **The Experience:**
    * **The Lab View:** Granular access to roadmaps, file repositories, and technical details.
    * **The Log:** Posting updates that feed into the Owner's dashboard.
    * **Staleness Alerts:** The system nudges them if a project hasn't been updated in 14 days.

## 3. Technical Stack
* **Framework:** Next.js 14+ (App Router)
* **Language:** TypeScript (Strict)
* **Styling:** Tailwind CSS + shadcn/ui (Default theme, professional/minimal)
* **Icons:** Lucide React
* **Database & Auth:** Supabase (PostgreSQL, GoTrue, Realtime)
* **Media Storage:** Supabase Storage (with potential for external video hosting later)
* **Deployment:** Vercel

## 4. Key Data Structure (Schema Intent)

* **Projects Table:** * `id`, `title`, `slug`
    * `status` (Idea, Validation, Scaling, Stalled)
    * `pitch_video_url` (The hero asset)
    * `owner_id` (The lead)
    * `last_updated_at` (Critical for "Staleness" logic)
    * `the_ask` (Current resource request: e.g., "$5k budget")
    
* **Updates Table:**
    * `project_id`, `content`, `type` (Milestone, Blocker, General)
    
* **Decisions Table:**
    * `project_id`, `question`, `options`, `status` (Pending, Approved)
    
* **Users Table:**
    * `role` (Owner, Admin, Viewer)

## 5. UI/UX Guidelines
* **Visual Priority:** Project Cards must have large thumbnail images/video previews.
* **Navigation:** Sidebar navigation based on Roles.
* **Roadmaps:** Visual Gantt-style timelines, not just date lists.
* **Feedback:** Toast notifications for success/errors.

