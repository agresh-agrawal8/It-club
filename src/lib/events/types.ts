/**
 * Event Engine domain types.
 *
 * These describe *any* event. Nothing here mentions a specific event — CODE
 * RED is a row in ev_events, not a type.
 */

export type EventStatus =
  | "draft"
  | "published"
  | "registration"
  | "live"
  | "judging"
  | "closed"
  | "archived";

export type EventVisibility = "public" | "unlisted" | "private";

export type EventRole =
  | "guest"
  | "student"
  | "participant"
  | "team_leader"
  | "volunteer"
  | "judge"
  | "admin"
  | "super_admin";

export type ParticipantStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "checked_in"
  | "withdrawn"
  | "disqualified";

export type TeamStatus =
  | "forming"
  | "pending"
  | "active"
  | "submitted"
  | "disqualified"
  | "withdrawn";

export type MissionStatus = "draft" | "scheduled" | "open" | "closed";

export type MissionState =
  | "locked"
  | "available"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "completed"
  | "rejected";

export type Severity = "info" | "success" | "warning" | "critical";

export type ScheduleKind =
  | "ceremony"
  | "session"
  | "deadline"
  | "break"
  | "challenge"
  | "judging";

/** Visual identity, stored on the event row so a module needs no code. */
export interface EventTheme {
  accent: string;
  accentSoft: string;
  surface: string;
  grid: string;
  mode: string;
  motion: "low" | "high";
  codename: string;
}

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  description: string | null;
  kind: string;
  status: EventStatus;
  visibility: EventVisibility;
  starts_at: string | null;
  ends_at: string | null;
  register_opens_at: string | null;
  register_closes_at: string | null;
  venue: string | null;
  capacity: number | null;
  team_min: number;
  team_max: number;
  cover_url: string | null;
  trailer_url: string | null;
  theme: Partial<EventTheme> | null;
  created_at: string;
}

/**
 * Capability flags. These are DATA (ev_event_settings), which is what lets one
 * codebase serve a hackathon and a quiz league — and lets an organiser turn a
 * misbehaving feature off mid-event without a deploy.
 */
export interface EventSettings {
  registration_mode: "auto" | "review" | "closed";
  teams_enabled: boolean;
  missions_enabled: boolean;
  qr_enabled: boolean;
  certificates_enabled: boolean;
  inventory_enabled: boolean;
  badges_enabled: boolean;
  gallery_enabled: boolean;
  leaderboard_visibility: "public" | "participants" | "staff";
  leaderboard_subject: "team" | "participant";
  ai_assistant_enabled: boolean;
}

export type EventCapability = keyof Pick<
  EventSettings,
  | "teams_enabled"
  | "missions_enabled"
  | "qr_enabled"
  | "certificates_enabled"
  | "inventory_enabled"
  | "badges_enabled"
  | "gallery_enabled"
  | "ai_assistant_enabled"
>;

export interface MissionCategory {
  id: string;
  event_id: string;
  name: string;
  slug: string;
  colour: string | null;
  icon: string | null;
  position: number;
}

export interface Mission {
  id: string;
  event_id: string;
  category_id: string | null;
  code: string;
  title: string;
  brief: string | null;
  description: string | null;
  difficulty: string;
  points: number;
  time_limit_s: number | null;
  max_attempts: number;
  requires_verification: boolean;
  verifier_role: EventRole;
  is_team_mission: boolean;
  unlock_at: string | null;
  lock_at: string | null;
  status: MissionStatus;
  position: number;
}

export interface MissionProgress {
  id: string;
  mission_id: string;
  participant_id: string | null;
  team_id: string | null;
  state: MissionState;
  attempts: number;
  score: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface ScheduleItem {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  kind: ScheduleKind;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  position: number;
}

export interface LeaderboardRow {
  event_id: string;
  subject_id: string;
  subject_kind: "team" | "participant";
  display_name: string;
  avatar_url: string | null;
  points: number;
  missions_done: number;
  last_award_at: string | null;
  rank: number;
}

export interface Badge {
  id: string;
  event_id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  rarity: string;
  points: number;
  position: number;
}

export interface Announcement {
  id: string;
  event_id: string;
  title: string;
  body: string | null;
  severity: Severity;
  pinned: boolean;
  published_at: string;
}

/** Result of a rule check — never a bare boolean, so the UI can explain itself. */
export type RuleResult = { ok: true } | { ok: false; reason: string };
