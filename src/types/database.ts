/**
 * Database types — mirrors supabase/migrations. In a live project these are
 * generated via `supabase gen types typescript`; kept here so the app is
 * fully typed before the CLI is wired up.
 */

export type UserRole = "visitor" | "member" | "admin" | "super_admin";
export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type EventStatus = "upcoming" | "ongoing" | "past" | "cancelled";
export type MediaKind = "image" | "video" | "file";
export type NotificationType =
  | "info"
  | "task"
  | "event"
  | "project"
  | "achievement"
  | "system";
export type SubscribeChannel = "email" | "whatsapp";

export interface Profile {
  id: string;
  member_id: string | null;
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
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  cover_url: string | null;
  technologies: string[];
  tags: string[];
  github_url: string | null;
  demo_url: string | null;
  docs_url: string | null;
  status: ProjectStatus;
  featured: boolean;
  view_count: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectAuthor {
  project_id: string;
  profile_id: string;
  role: string | null;
  created_at: string;
}

export interface ProjectMedia {
  id: string;
  project_id: string;
  kind: MediaKind;
  url: string;
  title: string | null;
  size_bytes: number | null;
  position: number;
  created_at: string;
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
  schedule: { time?: string; title?: string; speaker?: string }[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  organizer: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  registration_url: string | null;
  result: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  album: string | null;
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
  project_id: string | null;
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

/** Convenience composites returned by joined queries. */
export interface ProjectWithAuthors extends Project {
  authors: Pick<Profile, "id" | "full_name" | "avatar_url" | "member_id">[];
  media?: ProjectMedia[];
}

export interface JoinRequest {
  id: string;
  name: string;
  email: string;
  grade: string | null;
  phone: string | null;
  interests: string[];
  experience: string | null;
  why: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}
