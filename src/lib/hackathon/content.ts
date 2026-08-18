/**
 * Infinium — the event, as data.
 *
 * Everything in this file comes straight from the official participant guide
 * (`Main guidleines.pdf`, v1.0), the 20 sealed problem briefs (`Problems.pdf`)
 * and the printed achievement cards (`Cards.pdf`). It is the single source of
 * truth for every public page under /hackathon.
 *
 * ── Why this is code and not a database table ──────────────────────────────
 * This content is fixed, identical for every visitor, and published once. It
 * used to live in `hack_problems` / `hack_achievements` / `hack_schedule` /
 * `hack_settings`, which meant four Supabase round-trips before the landing
 * page could render — for bytes that never change. As constants the same
 * pages render statically at build time with zero network calls, which is the
 * single largest performance win available to this module.
 *
 * The database now holds only what is genuinely dynamic: teams, their members,
 * their results, and announcements.
 */

/* ═══════════════════════════ THE EVENT ═══════════════════════════ */

export const EVENT = {
  name: "Infinium",
  wordmark: "INFINIUM",
  tagline: "Build · Adapt · Innovate",
  blurb:
    "One day, two tracks, no internet. Your team opens a sealed problem and builds a real, working app — while a parallel quiz runs alongside.",
  edition: "IT Fest 2026",
  format: "One-day software hackathon",
  school: "Emerald Heights International School",
  venue: "Emerald Heights International School, Indore",
  /** 15 September 2026 — doors 8:30 AM, closing by 3:00 PM IST. */
  startsAt: "2026-09-15T08:30:00+05:30",
  dateLabel: "Tuesday, 15 September 2026",
  timeLabel: "8:30 AM – 3:00 PM",
  endsAt: "2026-09-15T15:00:00+05:30",
  /** Envelopes are opened at 9:20 AM — the moment the build clock starts. */
  revealAt: "2026-09-15T09:20:00+05:30",
  /** Code freeze, 2:15 PM sharp. */
  freezeAt: "2026-09-15T14:15:00+05:30",
  maxTeams: 20,
  minTeamSize: 2,
  maxTeamSize: 5,
  classes: "Classes VI–XII",
  externalNote: "External schools subject to organiser approval",
} as const;

/** The four headline facts, as shown in the guide's "event at a glance" panel. */
export const AT_A_GLANCE = [
  { label: "Duration", value: "1 Day", icon: "clock" },
  { label: "Teams", value: "20", icon: "users" },
  { label: "Team size", value: "Up to 5", icon: "crown" },
  { label: "Open to", value: "Classes VI–XII", icon: "cap" },
] as const;

/** Section 01 — what sets Infinium apart. */
export const PILLARS = [
  {
    n: "01",
    icon: "target",
    title: "Unique Problem, Every Team",
    desc: "No two teams build the same thing. Zero copying — pure originality.",
  },
  {
    n: "02",
    icon: "compass",
    title: "Plan Before You Build",
    desc: "A mandatory planning phase forces structured thinking first.",
  },
  {
    n: "03",
    icon: "power",
    title: "A Fully Offline Build",
    desc: "No internet and no AI all day — real problem-solving only.",
  },
  {
    n: "04",
    icon: "ticket",
    title: "Developer Passport",
    desc: "Earn achievement cards for engineering best practices.",
  },
  {
    n: "05",
    icon: "shuffle",
    title: "Surprise Challenges",
    desc: "A surprise curveball lands through the day to test adaptation.",
  },
  {
    n: "06",
    icon: "message",
    title: "Judged in Person",
    desc: "Judges come to your desk — you demo the running build yourself.",
  },
] as const;

/** Section 02 — the three-step format. */
export const HOW_IT_WORKS = [
  {
    step: "Step 01",
    kicker: "Briefing",
    title: "Rules & Team Setup",
    desc: "A short session a day or two before covers the rules and team roles. Problems stay sealed.",
    icon: "lock",
  },
  {
    step: "Step 02",
    kicker: "Plan Ahead",
    title: "Assign Roles & Plan",
    desc: "Pick your roles and quiz reps, then define your MVP and roadmap.",
    icon: "compass",
  },
  {
    step: "Step 03",
    kicker: "Build",
    title: "Forge Your Product",
    desc: "On Hackathon Day, development begins immediately from your plan.",
    icon: "hammer",
  },
] as const;

/** What every sealed envelope contains. */
export const ENVELOPE_CONTENTS = [
  "A unique real-world problem statement",
  "The expected outcome",
  "Constraints, if any",
  "Special considerations",
] as const;

/* ═══════════════════════════ TEAMS & ROLES ═══════════════════════════ */

export type MemberRole = "captain" | "frontend" | "backend" | "uiux" | "docs";

export const ROLES: {
  id: MemberRole;
  title: string;
  desc: string;
  icon: string;
  lead?: boolean;
}[] = [
  {
    id: "captain",
    title: "Team Captain",
    desc: "Owns direction, time management and final calls. Keeps the sprint on track and represents the team.",
    icon: "crown",
    lead: true,
  },
  {
    id: "frontend",
    title: "Frontend Developer",
    desc: "Builds the interface users touch.",
    icon: "layout",
  },
  {
    id: "backend",
    title: "Backend Developer",
    desc: "Owns data, logic and APIs.",
    icon: "server",
  },
  {
    id: "uiux",
    title: "UI / UX Designer",
    desc: "Shapes the experience and flow.",
    icon: "pen",
  },
  {
    id: "docs",
    title: "Docs & Presentation Lead",
    desc: "Documents and tells the story.",
    icon: "file",
  },
];

export const ROLE_LABEL: Record<MemberRole, string> = {
  captain: "Team Captain",
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  uiux: "UI / UX Designer",
  docs: "Docs & Presentation Lead",
};

/** Exactly two members are nominated to play the quiz on Hack Day. */
export const QUIZ_REPS_REQUIRED = 2;

export const ROLE_NOTES = [
  "Every role must be owned by someone, and every member should understand the whole project.",
  `Before the event, also pick ${QUIZ_REPS_REQUIRED} Quiz Representatives from these five members — they play the Quiz on Hack Day while the others build.`,
] as const;

/* ═══════════════════════════ THE DAY ═══════════════════════════ */

export type ScheduleTrack = "hack" | "quiz" | "surprise";

export interface ScheduleItem {
  time: string;
  /** ISO timestamp, used for the "happening now" marker. */
  at: string;
  title: string;
  desc: string;
  track: ScheduleTrack;
  icon: string;
  /** Runs at the same time as the previous item, on the other track. */
  parallel?: boolean;
}

/** Section 04 — one day, start to finish. Doors 8:30 AM, closing by 3:00 PM. */
export const SCHEDULE: ScheduleItem[] = [
  {
    time: "8:30 AM",
    at: "2026-09-15T08:30:00+05:30",
    title: "Arrival & Machine Check",
    desc: "Teams settle in, set up laptops or lab PCs, and confirm their toolchain works offline.",
    track: "hack",
    icon: "users",
  },
  {
    time: "9:00 AM",
    at: "2026-09-15T09:00:00+05:30",
    title: "Opening & Rules Briefing",
    desc: "Format, offline rules, achievement cards and judging explained in one short session.",
    track: "hack",
    icon: "mic",
  },
  {
    time: "9:20 AM",
    at: "2026-09-15T09:20:00+05:30",
    title: "Sealed Envelope Reveal",
    desc: "Every team opens its own problem brief for the first time. The clock starts here.",
    track: "quiz",
    icon: "mail",
  },
  {
    time: "9:35 AM",
    at: "2026-09-15T09:35:00+05:30",
    title: "Planning Window · 30 min",
    desc: "Read, scope and divide the work on paper. No code yet — plan before you build.",
    track: "hack",
    icon: "clipboard",
  },
  {
    time: "10:05 AM",
    at: "2026-09-15T10:05:00+05:30",
    title: "Build Sprint I",
    desc: "Three members start the core build.",
    track: "hack",
    icon: "cpu",
  },
  {
    time: "10:05 AM",
    at: "2026-09-15T10:05:00+05:30",
    title: "Quiz Round 1 · Pen & Paper",
    desc: "Reps leave for the written round, then return.",
    track: "quiz",
    icon: "message",
    parallel: true,
  },
  {
    time: "11:20 AM",
    at: "2026-09-15T11:20:00+05:30",
    title: "Build Sprint II",
    desc: "Core features come together.",
    track: "hack",
    icon: "cpu",
  },
  {
    time: "11:20 AM",
    at: "2026-09-15T11:20:00+05:30",
    title: "Quiz Round 2 · Surprise",
    desc: "The secret-format round runs in the arena.",
    track: "quiz",
    icon: "message",
    parallel: true,
  },
  {
    time: "12:05 PM",
    at: "2026-09-15T12:05:00+05:30",
    title: "Surprise Task Drops · 45 min",
    desc: "One task lands for every team at once. Fold it into your build for bonus points.",
    track: "surprise",
    icon: "shuffle",
  },
  {
    time: "12:50 PM",
    at: "2026-09-15T12:50:00+05:30",
    title: "Build Sprint III",
    desc: "Full team back together — finish features and start stabilising.",
    track: "hack",
    icon: "cpu",
  },
  {
    time: "1:30 PM",
    at: "2026-09-15T13:30:00+05:30",
    title: "Lunch · 20 min",
    desc: "Fixed break, 1:30 to 1:50. Machines stay as they are.",
    track: "quiz",
    icon: "box",
  },
  {
    time: "1:50 PM",
    at: "2026-09-15T13:50:00+05:30",
    title: "Final Polish & Code Freeze",
    desc: "Last fixes, copy your project to USB, write the README. Freeze at 2:15 PM sharp.",
    track: "hack",
    icon: "check",
  },
  {
    time: "2:15 PM",
    at: "2026-09-15T14:15:00+05:30",
    title: "Judging Round",
    desc: "Four judges work in parallel across both labs, five teams each. Demo the running build at your own desk — 6 minutes per team.",
    track: "hack",
    icon: "monitor",
  },
  {
    time: "2:45 PM",
    at: "2026-09-15T14:45:00+05:30",
    title: "Wrap-Up & Close · by 3:00 PM",
    desc: "Judging concludes, achievement cards are collected, and the day closes.",
    track: "quiz",
    icon: "check",
  },
];

export const TRACK_LABEL: Record<ScheduleTrack, string> = {
  hack: "Hackathon Track",
  quiz: "Quiz Track · 2 Reps",
  surprise: "Surprise Task",
};

/* ═══════════════════════════ OFFLINE RULE ═══════════════════════════ */

export const STACK = [
  "React",
  "Next.js",
  "Vue",
  "Flutter",
  "Node.js",
  "Django",
  "Flask",
  "SQLite",
  "JSON files",
  "SQL",
  "MongoDB",
  "+ your choice",
] as const;

export const COME_PREPARED = {
  title: "Come Prepared",
  kicker: "Bring it with you",
  body: "Nothing can be downloaded on the day. Install your editor, language runtime, libraries and any starter templates before you arrive, and bring them on your own laptop or a USB drive.",
  chips: ["Editor installed", "Runtime ready", "Libraries cached", "Docs offline", "USB drive"],
} as const;

export const OFFLINE_RULE = {
  title: "Fully Offline",
  kicker: "The one hard rule",
  body: "No internet for the entire build. That means no AI assistants, no searching for answers, no live APIs and no cloud services. Everything your project needs must run on your machine.",
  points: [
    { label: "No internet or AI", icon: "power" },
    { label: "Local files & data OK", icon: "save" },
    { label: "Monitored throughout", icon: "eye" },
  ],
} as const;

/* ═══════════════════════════ SURPRISE TASK ═══════════════════════════ */

export const SURPRISE_TASK = {
  dropsAt: "12:05 PM",
  window: "45 minutes",
  body: "One task drops for all teams at once at 12:05 PM. You get 45 minutes to fold it into your build, then show it to the judges for bonus points.",
  examples: [
    { label: "Accessibility feature", icon: "accessibility" },
    { label: "Dark mode", icon: "moon" },
    { label: "Multilingual support", icon: "globe" },
    { label: "Better responsiveness", icon: "smartphone" },
    { label: "Performance boost", icon: "gauge" },
    { label: "A surprise feature", icon: "plus" },
  ],
} as const;

/* ═══════════════════════════ DEVELOPER PASSPORT ═══════════════════════════ */

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

export interface AchievementCard {
  code: string;
  no: string;
  rarity: Rarity;
  points: number;
  title: string;
  desc: string;
  howTo: string;
  icon: string;
}

/**
 * The 20 printed achievement cards, verbatim from `Cards.pdf`.
 *
 * Cards are earned on paper during the event and collected at the close — the
 * website never awards them. They are published here so teams know what to aim
 * for before the day.
 */
export const ACHIEVEMENTS: AchievementCard[] = [
  {
    code: "INF-C01",
    no: "001",
    rarity: "Common",
    points: 10,
    title: "Repo Initialized",
    desc: "Every project starts here — you set up version control and gave your build a home for its history.",
    howTo: "Run git init and make your project a tracked repository.",
    icon: "git-branch",
  },
  {
    code: "INF-C02",
    no: "002",
    rarity: "Common",
    points: 10,
    title: "First Commit",
    desc: "The first real snapshot of your work, saved to history forever. The engine is running.",
    howTo: "Make your first commit to your local repository.",
    icon: "git-commit",
  },
  {
    code: "INF-C03",
    no: "003",
    rarity: "Common",
    points: 10,
    title: "Branch & Merge",
    desc: "You worked on a separate branch and merged it back cleanly — the mark of a real team workflow.",
    howTo: "Create a branch, commit on it, and merge it back.",
    icon: "git-merge",
  },
  {
    code: "INF-C04",
    no: "004",
    rarity: "Common",
    points: 10,
    title: "Commit Discipline",
    desc: "A readable history of small, meaningful commits — proof of how the build actually happened.",
    howTo: "Reach ten or more clear, well-described commits.",
    icon: "list",
  },
  {
    code: "INF-R01",
    no: "005",
    rarity: "Rare",
    points: 20,
    title: "Feature Builder",
    desc: "You shipped a complete, working feature end-to-end — not a stub, but the real thing.",
    howTo: "Build and demonstrate one fully functional feature.",
    icon: "blocks",
  },
  {
    code: "INF-R02",
    no: "006",
    rarity: "Rare",
    points: 20,
    title: "Frontend Wired",
    desc: "A clean, interactive interface that responds to every click — the face of your product is alive.",
    howTo: "Build a working, interactive frontend for your app.",
    icon: "layout",
  },
  {
    code: "INF-R03",
    no: "007",
    rarity: "Rare",
    points: 20,
    title: "Server Running",
    desc: "The engine room is running on localhost — reliable server logic quietly powering everything above it.",
    howTo: "Run a working local server that your app depends on.",
    icon: "server",
  },
  {
    code: "INF-R04",
    no: "008",
    rarity: "Rare",
    points: 20,
    title: "Data Persisted",
    desc: "You modelled your data and stored it locally so nothing is lost when the program closes.",
    howTo: "Save and reload real data from a local database or file.",
    icon: "database",
  },
  {
    code: "INF-R05",
    no: "009",
    rarity: "Rare",
    points: 20,
    title: "Dataset Wired",
    desc: "No internet, so you built your own source of truth — a real dataset your app reads and queries.",
    howTo: "Load and use a local dataset or the provided sample file.",
    icon: "table",
  },
  {
    code: "INF-R06",
    no: "010",
    rarity: "Rare",
    points: 20,
    title: "Responsive Build",
    desc: "Your interface adapts gracefully from phone to desktop without a single crack.",
    howTo: "Make your app work cleanly across mobile and desktop.",
    icon: "smartphone",
  },
  {
    code: "INF-E01",
    no: "011",
    rarity: "Epic",
    points: 40,
    title: "Bug Squashed",
    desc: "You hunted down an elusive, breaking bug and fixed it with surgical precision.",
    howTo: "Diagnose and resolve a critical, hard-to-find bug.",
    icon: "bug",
  },
  {
    code: "INF-E02",
    no: "012",
    rarity: "Epic",
    points: 40,
    title: "Own Algorithm",
    desc: "No API to call, so you wrote the logic yourself — real decision-making built by hand.",
    howTo: "Implement your own non-trivial algorithm (matching, scoring, routing).",
    icon: "cpu",
  },
  {
    code: "INF-E03",
    no: "013",
    rarity: "Epic",
    points: 40,
    title: "Test Covered",
    desc: "You wrote automated tests — proof your code does what you claim, and keeps doing it.",
    howTo: "Add automated tests covering core functionality.",
    icon: "flask",
  },
  {
    code: "INF-E04",
    no: "014",
    rarity: "Epic",
    points: 40,
    title: "Performance Tuned",
    desc: "You made it fast — measurably trimming load times and smoothing every interaction.",
    howTo: "Measurably improve your app's speed or efficiency.",
    icon: "gauge",
  },
  {
    code: "INF-E05",
    no: "015",
    rarity: "Epic",
    points: 40,
    title: "Secured",
    desc: "You took user trust seriously — added authentication and protected the data that matters.",
    howTo: "Implement meaningful auth or data-protection measures.",
    icon: "shield",
  },
  {
    code: "INF-E06",
    no: "016",
    rarity: "Epic",
    points: 40,
    title: "Accessible Build",
    desc: "You built something everyone can use — keyboard, screen reader, and every device welcome.",
    howTo: "Meet key accessibility standards across your interface.",
    icon: "accessibility",
  },
  {
    code: "INF-L01",
    no: "017",
    rarity: "Legendary",
    points: 75,
    title: "Runs Anywhere",
    desc: "The hardest test in an offline build — your project runs on a machine that is not yours, first try.",
    howTo: "Set up and run your project on another team's machine from your USB copy.",
    icon: "usb",
  },
  {
    code: "INF-L02",
    no: "018",
    rarity: "Legendary",
    points: 75,
    title: "One-Command Setup",
    desc: "Anyone can go from folder to running app in a single step — no guesswork, no missing pieces.",
    howTo: "Make your project run from a single documented command.",
    icon: "refresh",
  },
  {
    code: "INF-L03",
    no: "019",
    rarity: "Legendary",
    points: 75,
    title: "Documented Build",
    desc: "Docs so clear a stranger could pick up your project, set it up, and understand every decision.",
    howTo: "Write a README with setup steps, features, and how it works.",
    icon: "file",
  },
  {
    code: "INF-L04",
    no: "020",
    rarity: "Legendary",
    points: 75,
    title: "Production Ready",
    desc: "The full journey complete — a working end-to-end app, documented, portable, and holding up live.",
    howTo: "Ship a documented, portable, fully working product by code freeze.",
    icon: "shield-check",
  },
];

export const RARITY_ORDER: Rarity[] = ["Common", "Rare", "Epic", "Legendary"];

/** Every card, if a team somehow earned all twenty. */
export const PASSPORT_MAX = ACHIEVEMENTS.reduce((sum, c) => sum + c.points, 0);

/* ═══════════════════════════ SEALED ENVELOPES ═══════════════════════════ */

export interface Envelope {
  no: number;
  code: string;
  domain: string;
  /**
   * Kept server-side for the organiser console only. Titles are deliberately
   * NOT rendered on any public page — every brief stays sealed until 9:20 AM
   * on event day.
   */
  title: string;
}

/**
 * The 20 problem envelopes from `Problems.pdf`.
 *
 * Only `domain` is ever shown publicly, and only as a list of the fields the
 * event covers. The titles exist here so the core team can assign a unique
 * envelope per team in the admin console — never for display to participants.
 */
export const ENVELOPES: Envelope[] = [
  { no: 1, code: "ENV-01", domain: "Healthcare", title: "BloodLink" },
  { no: 2, code: "ENV-02", domain: "Education", title: "StudyForge" },
  { no: 3, code: "ENV-03", domain: "Environment", title: "SortRight" },
  { no: 4, code: "ENV-04", domain: "Agriculture", title: "CropGuard" },
  { no: 5, code: "ENV-05", domain: "Disaster Management", title: "ReliefMap" },
  { no: 6, code: "ENV-06", domain: "Accessibility", title: "AccessPath" },
  { no: 7, code: "ENV-07", domain: "Cyber Safety", title: "PhishGuard" },
  { no: 8, code: "ENV-08", domain: "Finance", title: "PocketWise" },
  { no: 9, code: "ENV-09", domain: "Food Waste", title: "PlateShare" },
  { no: 10, code: "ENV-10", domain: "Mental Health", title: "MindEase" },
  { no: 11, code: "ENV-11", domain: "Transportation", title: "BusTrack" },
  { no: 12, code: "ENV-12", domain: "Women Safety", title: "SafeRoute" },
  { no: 13, code: "ENV-13", domain: "Smart City", title: "CivicFix" },
  { no: 14, code: "ENV-14", domain: "Tourism", title: "HeritageQR" },
  { no: 15, code: "ENV-15", domain: "Wildlife", title: "RescueLink" },
  { no: 16, code: "ENV-16", domain: "Energy", title: "WattWise" },
  { no: 17, code: "ENV-17", domain: "Community Service", title: "VolunteerConnect" },
  { no: 18, code: "ENV-18", domain: "Sports", title: "FixturePro" },
  { no: 19, code: "ENV-19", domain: "Public Safety", title: "FoundIt" },
  { no: 20, code: "ENV-20", domain: "Space Technology", title: "MarsBase" },
];

/** What every brief contains, and what every team hands back. */
export const BRIEF_SECTIONS = [
  "Problem statement",
  "Target users",
  "Objectives",
  "Mandatory features",
  "Bonus features",
  "Constraints",
  "Expected deliverables",
  "A bonus challenge",
] as const;

export const DELIVERABLES = [
  "Working demo on your own machine",
  "Local Git history (commits)",
  "Project folder copied to USB",
  "README with setup steps",
  "Sketch of how it works (on paper)",
] as const;

/* ═══════════════════════════ JUDGING ═══════════════════════════ */

export const JUDGING = {
  intro:
    "Judges move table to table during the judging round. Four judges work in parallel across both labs — five teams each — so every team gets the same six minutes at its own desk. You demo the running build on your own machine and answer questions: no stage, no slides required.",
  lookFor: [
    "Technical understanding",
    "Project architecture",
    "Workflow & coordination",
    "Decision-making",
    "Problem-solving approach",
  ],
  slots: [
    { mins: 2, title: "Explain It", desc: "Your problem, your solution, your approach." },
    { mins: 3, title: "Run It", desc: "Demo the working build on your machine." },
    { mins: 1, title: "Q & A", desc: "Judges probe your understanding." },
  ],
  submit: ["Source code", "Local Git history", "Project folder on USB", "README"],
  note: "Any member may be asked — everyone should be able to explain the build.",
  /** Marking happens on paper. The website only publishes the final result. */
  offlineNote:
    "All judging and marking is done in person on the official paper sheet. Your scanned sheet and final score appear in your team portal once the core team publishes them.",
} as const;

/* ═══════════════════════════ THE QUIZ ═══════════════════════════ */

/**
 * The IT Quiz runs alongside the hackathon and is played entirely off this
 * website — pen and paper for Round 1, a live arena round for Round 2. Marks
 * are recorded on the physical evaluation sheet. This is reference material
 * for the two nominated reps, not a feature.
 */
export const QUIZ = {
  intro:
    "Two nominated reps per team play the IT Quiz while the rest of the team keeps building. Both rounds are played in person — nothing is submitted through this site.",
  team: [
    { label: "1 Junior", sub: "Classes VI–IX" },
    { label: "1 Senior", sub: "Classes X–XII" },
  ],
  teamNote: "The combined score of both players decides the team's ranking.",
  scoring: {
    title: "Round 1 + Round 2",
    body: "Highest total wins. A tie is settled by a sudden-death question.",
  },
  rounds: [
    {
      n: 1,
      title: "Pen & Paper",
      icon: "pen",
      badge: "10",
      badgeLabel: "Questions",
      desc: "A written round with 10 questions. No computers — just you, a pen, and what you know. The top reps move on to Round 2.",
      points: ["15 Junior + 15 Senior questions", "Bonus questions included", "Top 5 teams qualify"],
    },
    {
      n: 2,
      title: "The Surprise Round",
      icon: "lightbulb",
      badge: "?",
      badgeLabel: "Undisclosed",
      desc: "The format is a secret until the moment it begins — a fun, fast test of knowledge. Reps play this while the rest of the team keeps coding.",
      points: ["Format revealed on the spot", "Buzzer, visual, audio or rapid-fire", "Bonus questions included"],
    },
  ],
  topics: [
    "Computer Fundamentals",
    "Internet & Cyber Safety",
    "Programming & Logic",
    "AI & Emerging Tech",
    "Tech Companies & History",
    "Current Tech Affairs",
    "Logos & Tech Trivia",
  ],
  rules: [
    "One Junior + one Senior per team",
    "No phones or smart devices",
    "No substitutions without approval",
    "Quiz Master's decision is final",
    "Misconduct means disqualification",
  ],
  note: "Quiz points are added to your team's overall score — so doing well here helps your team climb the leaderboard.",
  certificates: "Certificates for all participants.",
} as const;

/* ═══════════════════════════ CONDUCT ═══════════════════════════ */

export const RULES = [
  {
    title: "General Discipline",
    icon: "users",
    tone: "brand",
    items: [
      "Stay in your assigned lab unless a coordinator moves you.",
      "Keep noise at a working level — other teams are concentrating.",
      "Treat volunteers, judges and coordinators with respect.",
      "Follow every instruction from teachers and coordinators.",
      "Wear your school ID and team badge at all times.",
    ],
  },
  {
    title: "The Offline Rule",
    icon: "power",
    tone: "danger",
    items: [
      "No internet for the entire build — no exceptions.",
      "No AI assistants, no searching, no cloud services.",
      "Mobile hotspots and mobile data are strictly prohibited.",
      "Phones stay in bags unless a coordinator allows otherwise.",
      "Machines may be checked at any time during the build.",
    ],
  },
  {
    title: "Fair Play & Original Work",
    icon: "scale",
    tone: "brand",
    items: [
      "All code must be written by your team on the day.",
      "Pre-installed libraries and frameworks are allowed.",
      "Bringing a pre-built project means disqualification.",
      "No copying from or helping another team.",
      "Any member may be asked to explain any part of the code.",
    ],
  },
  {
    title: "Lab & Equipment Care",
    icon: "box",
    tone: "accent",
    items: [
      "Do not change system settings on school computers.",
      "No food or drink at the workstations.",
      "Report any hardware fault to the technical team at once.",
      "Save your work often and keep a backup on your USB.",
      "Leave your station clean and tidy before you go.",
    ],
  },
] as const;

export const PENALTIES = {
  title: "Penalties",
  body: "Point deductions for minor breaches; disqualification for cheating, internet use, or misconduct.",
} as const;

export const SPIRIT = {
  title: "The Spirit of It",
  body: "Help your teammates, congratulate your rivals, and finish the day proud of what you built.",
} as const;

export const CONDUCT_INTRO =
  "Infinium is a competition, but it is also a school event. These rules keep the day fair, safe and enjoyable for everyone. Breaking them costs your team points; serious breaches mean disqualification.";

/* ═══════════════════════════ THE TEAM ═══════════════════════════ */

export const COMMITTEE = [
  "Vrinda Agrawal",
  "Agresh Agrawal",
  "Advik Jain",
  "Yash",
  "Pragun Bhartiya",
  "Labdhi Dhabaria",
] as const;

export const TEACHER_COORDINATORS = ["Ashirwad Sir", "Rajesh Sir", "Avinchal Sir"] as const;

export const COMMITTEE_NOTE =
  "For any questions before or during the event, reach out to the Organizing Committee or any of the teacher coordinators.";

/* ═══════════════════════════ HELPERS ═══════════════════════════ */

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function envelopeByNo(no: number | null | undefined) {
  if (!no) return null;
  return ENVELOPES.find((e) => e.no === no) ?? null;
}
