Superlab — Product Requirements Document (PRD) v1

Product: Superlab (internal incubator portal for Supermedia)
Version: v1 (MVP → V1.0)
Primary goal: Replace long email threads with a single, interactive "incubator OS" that provides clarity, continuous updates, collaboration, and executive decision-making in one place.
Audience: Top Management (Owner), internal stakeholders, project leads, editors.

1) Problem & Vision
Problem

Projects/ideas are currently documented across emails, chats, and scattered files. This causes:

Loss of context and artifacts (videos/prototypes/links not centralized)

Slow decision-making (asks buried in threads)

Poor visibility (unclear portfolio direction, risks, and momentum)

Repetitive reporting overhead

Vision

Superlab is a secure internal portal where each project is a living asset:

Easy to understand in 2 minutes (executive-ready)

Continuously updated with a structured changelog

Collaborative (ideas, comments, tasks, milestones)

Decisionable (clear "asks", approvals, commitments, and traceability)

Directional (analytics show where we're going)

2) Roles & Permissions (RBAC)
Roles

Owner (Top Management)

Read all projects

Comment/mention

Approve / reject / request info on Decisions

Create Commitments (budget/intros/hiring support)

View Analytics dashboards

Lab Admin

All Owner capabilities

Create/edit project templates & taxonomy

Manage users and roles

Override access if needed

Project Lead

Create/edit projects they own

Publish updates, manage milestones/tasks/assets/contacts

Create "Needs/Asks" and Decisions requests

Invite internal stakeholders to a project

Editor

Edit content sections (Overview/Highlights/pages)

Upload/manage assets

Create milestones/tasks (if allowed per project)

No permission to approve decisions unless also Owner/Admin

Viewer

Read projects they have access to

Comment if enabled

No editing

Access rules

Default: internal-only access.

Project-level ACL: some projects may be visible only to certain stakeholders.

RLS enforced at DB level (Supabase RLS).

3) Core Objects (Data Model)

Projects

id, title, slug, summary (1-liner), category, stage, status, priority

owner_id, created_at, updated_at

confidence_score (1–5), risk_level (low/med/high)

last_meaningful_update_at

Project Pages / Content

structured content blocks (rich text / block editor)

separate "Highlights" (executive curated)

version history (min last 10 revisions)

Assets / Media Library

images, videos, docs, links

tags (pitch, prototype, research, meeting, competitor, etc.)

pinned flag (assets shown in Owner view)

Updates (Changelog)

update type: Progress / Risk / Ask / Decision / KPI

timestamped, attributed, immutable (edit allowed only with audit trail)

Milestones

title, description, due date, owner_id

status: planned / in_progress / done / blocked

optional dependencies, linked needs/asks

Tasks (Next Steps)

title, assignee, due date, status, linked milestone (optional)

Contacts / Stakeholders

internal stakeholders (users)

external contacts (name, org, role, email, phone, notes)

optional relationship type & last interaction date

Needs / Asks

type: budget / intro / supplier / legal / hiring / other

urgency, status: open / in_review / fulfilled / rejected

linked to milestone and/or decision

Decisions

question, options, requested_by, approver_id

status: pending / approved / rejected / info_requested

decided_at, rationale/notes

Commitments

created when a Decision is approved (optional but recommended)

commitment type: budget_amount / intro / hiring / resource_allocation

owner_id (Top management), due date, status

Comments / Threads

per project and per module (updates, decisions, ideas)

mentions (@user)

Events (Analytics)

event_type: stage_changed, milestone_completed, decision_approved, ask_created, etc.

used for momentum & forecasting dashboards

4) Key User Experiences & Pages
A) Authentication

SSO preferred: Google Workspace / Microsoft 365

fallback: email magic link

enforce role + project ACL

B) Projects Library (Home / Browse)

Card layout, "Netflix-style"

Filters: stage, category, priority, owner, status

Search (title, summary, tags)

Sort: last update, priority, stage

C) Project Page — Dual View System (Critical)

Each project has two modes:

1) Owner View (Executive / Pitch)

Hero section: 1-liner + "why now"

Curated Highlights (3–7 bullets)

Latest change summary (since last review)

"Needs now" + "Decisions required" cards (with deadlines)

Milestone timeline (next 30/60/90)

Pinned assets (video/prototype/diagram)

Action buttons: Approve / Reject / Request Info / Assign Support

2) Team View (Workspace)
Tabs (or sub-pages) inside project:

Overview (rich content)

Highlights (editor curated)

Assets (media library)

Milestones (CRUD + status)

Next Steps (task list)

Stakeholders & Contacts (directory)

Updates (changelog)

Needs / Asks

Decisions

Discussion (threads + mentions)

Ideas (idea box with optional voting)

D) Notifications

In-app notifications + optional email

Triggers:

mention

decision status change

ask created/updated

milestone due soon

weekly digest (portfolio + subscribed projects)

User settings: opt-in per project

E) Analytics (Detailed + Directional)

Analytics must show "where we are going", not just current state.

Tab 1 — Portfolio Health (Today)

Projects by stage distribution

"Stale" projects (no meaningful update in X days)

Blocked projects + reason

Open asks by type/urgency

Pending decisions queue

Tab 2 — Momentum (Last 30/90 days)

Updates/week per project

Milestone completion rate

Time-in-stage (avg per stage)

Decision response time (avg)

Execution load (tasks created vs completed)

Tab 3 — Forecast (Next 30/60/90)

Upcoming milestones timeline across projects

Decisions required this week/month (deadlines)

Resource pipeline: asks requested vs approved vs committed

Capacity bottlenecks (tasks overloaded per assignee)

5) Workflows (Must be enforced)
Project lifecycle

Idea → Validation → Pilot → Traction → Scaling → Archived

Weekly update rule

Each active project should have a weekly update (even "no change + blocked reason").
This powers momentum and stale detection.

Decision workflow (traceability)

Project Lead creates a Decision request (question + options + deadline)

Owner responds: approve/reject/request info

If approved: create a Commitment record (optional but recommended)

Notify stakeholders

Log event for analytics

Needs/Ask workflow

Need created with type + urgency + link to milestone

Status tracked until fulfilled/rejected

Owner can convert Need into a Decision if needed

6) MVP Scope (V1)
Must-have (ship first)

Auth + RBAC + project ACL (RLS)

Projects library + project page dual view

Rich editor for Overview + separate Highlights editor

Assets library (upload/tag/pin)

Milestones + Tasks (CRUD)

Stakeholders & Contacts module

Updates changelog (timestamped)

Needs/Asks + Decisions + basic Commitments

Notifications: mentions + decision updates + weekly digest (basic)

Analytics v1: Health + Momentum + Forecast (core metrics)

Nice-to-have (post-MVP)

Voting on ideas

Decision templates

Advanced budgeting (spend tracking)

External guest access

Integrations (Slack/Email/Calendar)

Out of scope (v1)

Full project management suite (Jira replacement)

Finance-grade accounting

Public access

7) Non-functional Requirements

Mobile-first responsive UI (critical)

Fast load time: project pages < 2s on normal connections

Auditability: track edits, decisions, approvals

Security: strict RLS, private storage buckets, signed URLs for assets

Reliability: daily DB backups, error logging (Sentry or similar)

Accessibility: basic a11y compliance (keyboard navigation for core actions)

8) Acceptance Criteria (Definition of Done)

An Editor can: edit Overview/Highlights, upload assets, create milestones/tasks.

A Project Lead can: fully manage project workspace + submit decisions/asks.

Owner can: review in Owner View, approve a decision, and that action is logged + notifies the lead.

Analytics shows: stage distribution, stale projects, pending decisions, upcoming milestones.

All permissions enforced via Supabase RLS (not just UI hiding).

9) Implementation Notes (Tech assumptions)

Preferred stack:

Next.js + Tailwind + shadcn/ui

Supabase (Auth, Postgres, Storage, RLS)

Rich editor: TipTap

Deployment: Vercel

Notifications: in-app + email provider (e.g., Resend)

10) Guiding Product Principle

Superlab is not a "pretty deck viewer".
It is a structured incubator OS that ensures clarity, momentum, traceable decisions, and directional analytics.

---

## Revenue Cockpit (PRD Addendum v1.1)

### Goals

The Revenue Cockpit provides executive-level visibility into Supermedia's revenue streams without replacing finance/accounting systems. It is a **dashboard + normalized data layer** for:

1. **Real-time revenue visibility** — Today/WTD/MTD/YTD across all streams
2. **Target tracking** — Actual vs. target per stream per month
3. **Risk monitoring** — Refund rates, missing data alerts, anomalies
4. **Forecasting** — Run-rate projections, gap to target

This is NOT:
- A full accounting system
- An invoicing or billing platform
- A replacement for financial audits

### Roles & Permissions

| Role | Access |
|------|--------|
| **Owner** | Full read/write to all revenue data |
| **Admin** | Full read/write to all revenue data |
| **LabAdmin** | Full read/write to all revenue data |
| Editor | ❌ No access |
| Viewer | ❌ No access |
| Project Lead | ❌ No access |

Revenue data is executive-only. RLS enforces this at database level.

### Core Tables

```
revenue_streams
├── id (UUID, PK)
├── name (TEXT, e.g. "Subscriptions", "Ad Revenue", "Licensing")
├── category (TEXT, e.g. "Recurring", "Transactional", "Partnership")
├── owner_id (FK → users)
├── is_active (BOOLEAN)
└── created_at (TIMESTAMPTZ)

revenue_sources
├── id (UUID, PK)
├── name (TEXT, e.g. "Stripe", "Google Ads", "Manual CSV")
├── type (ENUM: 'Manual', 'API', 'Webhook', 'CSV')
├── config_json (JSONB, API credentials/settings)
├── is_active (BOOLEAN)
└── created_at (TIMESTAMPTZ)

revenue_entries
├── id (UUID, PK)
├── date (DATE, transaction date)
├── amount (DECIMAL 12,2)
├── currency (TEXT, default 'EUR')
├── stream_id (FK → revenue_streams)
├── source_id (FK → revenue_sources)
├── entry_type (ENUM: 'Sale', 'Refund', 'Subscription', 'AdRevenue', 'License', 'Other')
├── status (ENUM: 'Pending', 'Confirmed', 'Cancelled')
├── reference_type (TEXT, e.g. 'invoice', 'transaction', 'payout')
├── reference_id (TEXT, external ID for deduplication)
├── notes (TEXT)
├── created_at (TIMESTAMPTZ)
└── UNIQUE(source_id, reference_type, reference_id) WHERE reference_id IS NOT NULL

revenue_targets
├── id (UUID, PK)
├── stream_id (FK → revenue_streams)
├── month_date (DATE, first of month)
├── target_amount (DECIMAL 12,2)
├── currency (TEXT)
└── UNIQUE(stream_id, month_date)

sync_runs
├── id (UUID, PK)
├── source_id (FK → revenue_sources)
├── started_at (TIMESTAMPTZ)
├── ended_at (TIMESTAMPTZ)
├── status (ENUM: 'Running', 'Success', 'Failed', 'Partial')
├── rows_imported (INTEGER)
└── error_log (TEXT)
```

### Ingestion Phases

**Phase 1 (MVP):** Manual CSV Upload
- User uploads CSV file
- Column mapping UI (saved to localStorage)
- Duplicate detection via (source_id, reference_type, reference_id)
- Preview before import
- Batch insert via server action

**Phase 2 (Post-MVP):** Automated Sync
- Stripe webhook integration
- Google Ads API sync
- Scheduled sync runs with logging
- Error handling and retry logic

### Dashboard Tabs

#### Tab 1: Overview
- **Key Metrics Cards:** Today / WTD / MTD / YTD totals
- **Run-rate Projection:** Current pace → projected month-end
- **MoM Change:** Percentage change vs. previous month
- **Stream Breakdown:** Pie/bar chart of revenue by stream

#### Tab 2: Streams
- **Per-stream cards:** Name, MTD actual, MTD target, % achieved
- **Trend chart:** Daily/weekly revenue per stream (last 30 days)
- **Target gap:** Visual indicator of over/under target

#### Tab 3: Risk
- **Refund Rate:** (refunds / (sales + refunds)) × 100 — flag if > 5%
- **Missing Data Alerts:** Streams with no entries in last X days
- **Status Distribution:** Pending vs. Confirmed vs. Cancelled entries
- **Anomaly Detection:** Unusually high/low days (simple ±2σ)

#### Tab 4: Forecast
- **Run-rate Forecast:** If current pace continues → EOY projection
- **Target Gap Analysis:** MTD remaining to hit target
- **Burn-down Chart:** Days remaining vs. amount remaining
- **YTD Cumulative:** Actual vs. target cumulative chart

### Acceptance Criteria

1. ✅ Owner/Admin/LabAdmin can access `/revenue` dashboard
2. ✅ Other roles see 403 or redirect (no access)
3. ✅ CSV import works: upload → map → preview → import
4. ✅ Duplicate entries are rejected (unique constraint)
5. ✅ Overview shows accurate Today/WTD/MTD/YTD calculations
6. ✅ Streams tab shows actual vs. target per stream
7. ✅ Risk tab shows refund rate and missing data warnings
8. ✅ Forecast tab shows run-rate projection
9. ✅ All data protected by RLS (database-enforced)
10. ✅ Mobile-responsive layout
