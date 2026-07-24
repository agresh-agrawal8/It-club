/**
 * Event rules — pure predicates, no I/O.
 *
 * These are the only place event policy lives. Keeping them free of Supabase
 * makes them unit-testable and means the same function decides both what the
 * UI shows and what the server accepts — the UI *hides* an unavailable action,
 * the server *rejects* it, and neither can drift from the other.
 */

import type {
  EventRecord,
  EventSettings,
  Mission,
  MissionProgress,
  MissionState,
  RuleResult,
} from "./types";

const ok: RuleResult = { ok: true };
const no = (reason: string): RuleResult => ({ ok: false, reason });

const at = (value: string | null | undefined) => (value ? new Date(value).getTime() : null);

/* ───────────────────────────── Registration ───────────────────────────── */

export function registrationOpen(
  event: EventRecord,
  settings: EventSettings,
  registeredCount: number,
  now = new Date(),
): RuleResult {
  if (settings.registration_mode === "closed") return no("Registration is closed.");
  if (event.status === "draft" || event.status === "archived")
    return no("This event is not open yet.");
  if (["live", "judging", "closed"].includes(event.status))
    return no("Registration for this event has ended.");

  const t = now.getTime();
  const opens = at(event.register_opens_at);
  const closes = at(event.register_closes_at);

  if (opens && t < opens) return no("Registration has not opened yet.");
  if (closes && t > closes) return no("Registration has closed.");
  if (event.capacity != null && registeredCount >= event.capacity)
    return no(`This event is full (${event.capacity} places).`);

  return ok;
}

export function teamSizeValid(event: EventRecord, memberCount: number): RuleResult {
  if (memberCount < event.team_min)
    return no(`A team needs at least ${event.team_min} member${event.team_min === 1 ? "" : "s"}.`);
  if (memberCount > event.team_max)
    return no(`A team can have at most ${event.team_max} members.`);
  return ok;
}

/* ────────────────────────────── Missions ────────────────────────────── */

/**
 * Resolve what state a mission is in for one subject (team or participant).
 *
 * Dependency and window checks are duplicated in Postgres
 * (`ev_available_missions`) precisely so that hiding a locked mission in the
 * UI is a convenience, not the control.
 */
export function missionState(
  mission: Mission,
  deps: Mission[],
  progressByMission: Map<string, MissionProgress>,
  now = new Date(),
): MissionState {
  const own = progressByMission.get(mission.id);
  if (own && ["completed", "rejected", "under_review", "submitted"].includes(own.state)) {
    return own.state;
  }

  if (mission.status !== "open") return "locked";

  const t = now.getTime();
  const unlock = at(mission.unlock_at);
  const lock = at(mission.lock_at);
  if (unlock && t < unlock) return "locked";
  if (lock && t > lock) return "locked";

  const unmet = deps.some((d) => progressByMission.get(d.id)?.state !== "completed");
  if (unmet) return "locked";

  if (own?.state === "in_progress") return "in_progress";
  return "available";
}

export function canStart(
  mission: Mission,
  state: MissionState,
  progress: MissionProgress | undefined,
): RuleResult {
  if (state === "locked") return no("This mission is still locked.");
  if (state === "completed") return no("You have already completed this mission.");
  if (state === "under_review") return no("This mission is awaiting review.");
  if ((progress?.attempts ?? 0) >= mission.max_attempts)
    return no(`No attempts left (limit ${mission.max_attempts}).`);
  return ok;
}

export function canSubmit(
  mission: Mission,
  state: MissionState,
  progress: MissionProgress | undefined,
  now = new Date(),
): RuleResult {
  if (state !== "in_progress" && state !== "available")
    return no("This mission is not open for submission.");

  const lock = at(mission.lock_at);
  if (lock && now.getTime() > lock) return no("The submission window has closed.");

  if (mission.time_limit_s && progress?.started_at) {
    const elapsed = (now.getTime() - new Date(progress.started_at).getTime()) / 1000;
    if (elapsed > mission.time_limit_s) return no("Your time limit for this mission has expired.");
  }

  return ok;
}

/** Seconds left on a timed mission, or null when it is untimed/not started. */
export function timeRemaining(
  mission: Mission,
  progress: MissionProgress | undefined,
  now = new Date(),
): number | null {
  if (!mission.time_limit_s || !progress?.started_at) return null;
  const elapsed = (now.getTime() - new Date(progress.started_at).getTime()) / 1000;
  return Math.max(0, Math.round(mission.time_limit_s - elapsed));
}

/* ───────────────────────────── Visibility ───────────────────────────── */

export function leaderboardVisible(
  settings: EventSettings,
  viewer: "guest" | "participant" | "staff",
): boolean {
  switch (settings.leaderboard_visibility) {
    case "public":
      return true;
    case "participants":
      return viewer !== "guest";
    case "staff":
      return viewer === "staff";
    default:
      return false;
  }
}

/** Certificates only exist once the event is actually over. */
export function certificatesAvailable(event: EventRecord, settings: EventSettings): boolean {
  return settings.certificates_enabled && ["closed", "archived"].includes(event.status);
}

/** Phase label for the landing page — derived, never stored. */
export function eventPhase(
  event: EventRecord,
  now = new Date(),
): "upcoming" | "registration" | "live" | "judging" | "ended" {
  if (["closed", "archived"].includes(event.status)) return "ended";
  if (event.status === "judging") return "judging";

  const t = now.getTime();
  const starts = at(event.starts_at);
  const ends = at(event.ends_at);

  if (starts && ends && t >= starts && t <= ends) return "live";
  if (ends && t > ends) return "ended";

  const opens = at(event.register_opens_at);
  const closes = at(event.register_closes_at);
  if (opens && closes && t >= opens && t <= closes) return "registration";

  return "upcoming";
}
