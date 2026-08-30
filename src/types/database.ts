/**
 * Database types — mirrors supabase/migrations.
 *
 * Note what is deliberately absent from `Profile`: there is no `email` and no
 * `member_id`. A member is a name, a password (which lives only in
 * `auth.users` as a bcrypt hash and is never selected) and one of two roles.
 */

/** Exactly two roles. There is no admin tier above core team. */
export type UserRole = "member" | "core_team";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type EventStatus = "upcoming" | "ongoing" | "past" | "cancelled";
/** Competitions are events with an organiser and a result, not a second table. */
export type EventKind = "workshop" | "competition" | "hackathon" | "talk" | "other";
export type MediaKind = "image" | "video" | "file";
export type NotificationType = "info" | "task" | "event" | "achievement" | "system";
export type SubscribeChannel = "email" | "whatsapp";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  headline: string | null;
  grade: string | null;
  skills: string[];
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  phone: string | null;
  phone_verified: boolean;
  is_active: boolean;
  /** Set by a core-team password reset; forces a change at next sign-in. */
  must_change_password: boolean;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  registration_url: string | null;
  status: EventStatus;
  kind: EventKind;
  organizer: string | null;
  result: string | null;
  schedule: { time?: string; title?: string; speaker?: string }[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A gallery item. The uploader supplies only `image_url` and `title`;
 * `slug`, `alt_text`, `width` and `height` are all derived server-side so the
 * upload form stays two fields wide while the public page still gets the
 * metadata it needs for SEO and for a zero-layout-shift render.
 */
export interface GalleryItem {
  id: string;
  title: string | null;
  slug: string;
  alt_text: string | null;
  image_url: string;
  width: number | null;
  height: number | null;
  tags: string[];
  position: number;
  created_by: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  awarded_on: string | null;
  category: string | null;
  profile_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  deadline: string | null;
  assignee_id: string | null;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  /** Urgent notices pop up on the recipient's dashboard. */
  urgent: boolean;
  created_at: string;
}

export interface Subscriber {
  id: string;
  channel: SubscribeChannel;
  contact: string;
  verified: boolean;
  created_at: string;
}

export interface Submission {
  id: string;
  name: string;
  email: string;
  category: "competition" | "company" | "content" | "other";
  title: string;
  message: string | null;
  file_url: string | null;
  link_url: string | null;
  handled: boolean;
  created_at: string;
}
