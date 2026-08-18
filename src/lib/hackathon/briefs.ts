import "server-only";

/**
 * The twenty sealed problem briefs, verbatim from `Problems.pdf`.
 *
 * ── Why `server-only` ──────────────────────────────────────────────────────
 * The entire format depends on no team seeing its problem before 9:20 AM on
 * event day. This import makes that structural rather than careful: if anyone
 * ever imports this file from a Client Component, the build fails instead of
 * quietly shipping all twenty briefs to every visitor's browser.
 *
 * Public pages import `ENVELOPES` from `content.ts`, which carries only the
 * domain names. Titles and contents live here and nowhere else.
 */

/** Identical on every printed brief, so stored once. */
export const BRIEF_CONSTRAINTS = [
  "**No internet.** Must run fully offline",
  "No external APIs or cloud services",
  "Use the provided sample dataset or your own",
  "One build day — working demo by code freeze",
  "Original work only — no plagiarism",
] as const;

export const BRIEF_DELIVERABLES = [
  "Working demo on your own machine",
  "Local Git history (commits)",
  "Project folder copied to USB",
  "README with setup steps",
  "Sketch of how it works (on paper)",
] as const;

export const BRIEF_JUDGING_FOCUS = [
  "Innovation",
  "Practicality",
  "UI / UX",
  "Working Demo",
  "Problem Solving",
  "Presentation",
] as const;

export interface Brief {
  no: number;
  code: string;
  domain: string;
  title: string;
  icon: string;
  statement: string;
  whyThisMatters: string;
  targetUsers: string[];
  objectives: string[];
  mandatoryFeatures: string[];
  bonusFeatures: string[];
  bonusChallenge: string;
}

export const BRIEFS: Brief[] = [
  {
    no: 1,
    code: "ENV-01",
    domain: "Healthcare",
    title: "BloodLink",
    icon: "droplet",
    statement:
      "A regional hospital network has approached your team. Their blood bank tracks stock on paper, so units expire in storage while a ward runs critically short, and staff phone around to find the right group. They want a desktop system, running entirely on the bank's own computer, that records every unit in and out, shows current availability by blood group, warns when a group falls below a safe level or is close to expiry, and keeps a searchable donor register. No internet: everything is stored in a local file or database on that one machine.",
    whyThisMatters:
      "Most blood wastage is a bookkeeping failure, not a supply failure. A clear local ledger prevents both expiry and shortage.",
    targetUsers: [
      "Hospital blood-bank staff",
      "Emergency-ward nurses",
      "Registered voluntary donors",
      "Regional health coordinators",
    ],
    objectives: [
      "Track stock by group locally",
      "Warn before expiry & shortage",
      "Keep a searchable donor register",
      "Replace the paper ledger",
    ],
    mandatoryFeatures: [
      "Record units issued & received",
      "Availability dashboard by blood group",
      "Low-stock & near-expiry warnings",
      "Donor register with search",
    ],
    bonusFeatures: [
      "Usage trend chart from stored history",
      "Donor eligibility countdown",
      "Printable daily stock report",
    ],
    bonusChallenge:
      "Add an “urgent request” screen that takes a blood group and instantly lists every eligible registered donor from the local database, sorted by how long since they last donated.",
  },
  {
    no: 2,
    code: "ENV-02",
    domain: "Education",
    title: "StudyForge",
    icon: "cap",
    statement:
      "A group of school teachers has asked for help. Their students lose hours every week simply deciding what to study and in what order, then abandon vague plans within days. The teachers want an intelligent study planner that takes a student's subjects, exam dates, and available hours and generates a realistic, personalised schedule. It should adapt when a student falls behind, break large topics into manageable sessions, and keep learners motivated with visible progress. The goal is a tool a student will actually open every morning, not another rigid timetable they ignore.",
    whyThisMatters:
      "Students rarely lack effort — they lack structure. Without adaptive planning, motivation collapses the moment a schedule slips.",
    targetUsers: [
      "School & board-exam students",
      "Teachers guiding study loads",
      "Parents monitoring progress",
      "Self-learners",
    ],
    objectives: [
      "Generate personalised study plans",
      "Adapt schedule when students slip",
      "Break topics into sessions",
      "Sustain motivation via progress",
    ],
    mandatoryFeatures: [
      "Input subjects, hours & exam dates",
      "Auto-generated daily/weekly plan",
      "Progress tracking per topic",
      "Reschedule missed sessions",
    ],
    bonusFeatures: [
      "Spaced-repetition revision reminders",
      "Streaks and achievement badges",
      "Weekly performance summary",
    ],
    bonusChallenge:
      "Add an “exam countdown rebalancer” that automatically redistributes remaining topics across the days left when a student marks themselves behind.",
  },
  {
    no: 3,
    code: "ENV-03",
    domain: "Environment",
    title: "SortRight",
    icon: "recycle",
    statement:
      "A city municipality is struggling with waste. Despite colour-coded bins, residents constantly mix wet, dry, and hazardous waste, which contaminates entire collections and sends recyclables to landfill. The municipality wants an application that teaches correct segregation in an engaging way: a resident can look up any item, learn which bin it belongs in and why, and earn rewards for consistent correct sorting. It should turn a dull civic duty into a habit people feel good about, and give the municipality data on which items confuse people most.",
    whyThisMatters:
      "Most contamination is not defiance but confusion — people genuinely do not know where an item goes, and there is no friendly place to ask.",
    targetUsers: [
      "Urban households",
      "Apartment communities",
      "Municipal waste teams",
      "School eco-clubs",
    ],
    objectives: [
      "Teach correct item segregation",
      "Reward consistent good sorting",
      "Surface commonly confused items",
      "Build lasting sorting habits",
    ],
    mandatoryFeatures: [
      "Searchable item → bin guide",
      "Points/rewards for logged sorting",
      "Category learning cards",
      "Household or class leaderboard",
    ],
    bonusFeatures: [
      "Guided “what is it made of?” finder",
      "Collection-day reminders",
      "Community impact statistics",
    ],
    bonusChallenge:
      "Build a weekly “contamination report” that shows a household which of their logged items they most often sort wrong, with a tip to fix it.",
  },
  {
    no: 4,
    code: "ENV-04",
    domain: "Agriculture",
    title: "CropGuard",
    icon: "sprout",
    statement:
      "A farmers' cooperative has reached out. Their small-holder members lose parts of every harvest to diseases they identify too late or misdiagnose, then spray the wrong treatment and waste money. Because their villages have no reliable network, they want a program that works with no connection at all: the farmer answers a short series of plain-language questions about what they can see — leaf colour, spots, wilting, which part is affected — and the app narrows it down to a likely disease from a built-in reference library, then gives clear, low-cost treatment and prevention steps.",
    whyThisMatters:
      "Expert agronomists cannot reach every village, and neither can the internet. A self-contained first opinion prevents avoidable loss and reckless spraying.",
    targetUsers: [
      "Small-holder farmers",
      "Agricultural extension workers",
      "Cooperative advisors",
      "Home gardeners",
    ],
    objectives: [
      "Diagnose by guided questions",
      "Give clear treatment guidance",
      "Reduce pesticide misuse",
      "Work with zero connectivity",
    ],
    mandatoryFeatures: [
      "Symptom question flow → likely disease",
      "Treatment & prevention advice",
      "Built-in crop/disease library",
      "Simple, low-literacy interface",
    ],
    bonusFeatures: [
      "Save past diagnoses for a plot",
      "Regional-language support",
      "Printable treatment sheet",
    ],
    bonusChallenge:
      "Add a “severity check” that asks how many plants show symptoms and how fast it spread, then advises whether to treat, isolate, or remove.",
  },
  {
    no: 5,
    code: "ENV-05",
    domain: "Disaster Management",
    title: "ReliefMap",
    icon: "alert",
    statement:
      "A district disaster authority needs your help. In a flood or earthquake the network is the first thing to fail, so any tool that needs the internet is useless exactly when it matters. They want a relief directory that lives entirely on the device: a built-in list of shelters, hospitals, food and water points with their locations, capacity and contact numbers, drawn on a simple stored map or diagram of the district. A coordinator can mark a resource open, full, or closed as reports come in by radio, and anyone can find the nearest help in seconds.",
    whyThisMatters:
      "In the first hours of a disaster, lives are lost not for want of help but because nobody can locate the help that already exists — and the network is down.",
    targetUsers: [
      "Affected residents",
      "Volunteers & first responders",
      "Relief coordinators",
      "Visitors & travellers",
    ],
    objectives: [
      "Work with no network at all",
      "Find nearest help fast",
      "Let coordinators update status",
      "Stay usable under panic",
    ],
    mandatoryFeatures: [
      "Built-in directory of shelters & aid",
      "Mark open / full / closed",
      "Nearest-resource lookup",
      "Filter by resource type",
    ],
    bonusFeatures: [
      "Stored district map or diagram",
      "Printable emergency contact sheet",
      "Multi-language safety tips",
    ],
    bonusChallenge:
      "Add a coordinator log that records every status change with a time, so the authority can reconstruct what was open when.",
  },
  {
    no: 6,
    code: "ENV-06",
    domain: "Accessibility",
    title: "AccessPath",
    icon: "accessibility",
    statement:
      "A large campus administration has approached your team. Students with mobility, visual, or other access needs struggle to move around because standard maps ignore ramps, lifts, step-free routes, and rest points. They want an accessibility-first navigator that lets a student set their needs once, then routes them along paths that actually work for them, warning about stairs, construction, or closed lifts. It should be usable one-handed, screen-reader friendly, and reduce the daily anxiety of not knowing whether a route will be passable.",
    whyThisMatters:
      "Maps are built for the average body. For students with disabilities, the “shortest” route is often the one they physically cannot take.",
    targetUsers: [
      "Students with disabilities",
      "Visitors with mobility needs",
      "Campus accessibility staff",
      "Event organisers",
    ],
    objectives: [
      "Route by accessibility needs",
      "Warn of barriers & closures",
      "Support screen-reader use",
      "Reduce navigation anxiety",
    ],
    mandatoryFeatures: [
      "Set personal access profile",
      "Step-free / ramp-aware routing",
      "Barrier & closure warnings",
      "High-contrast, labelled UI",
    ],
    bonusFeatures: [
      "Step-by-step written directions",
      "Report a new barrier",
      "Rest-point suggestions on long routes",
    ],
    bonusChallenge:
      "Let staff mark a lift or ramp out of service on the stored campus map and have every affected route recalculate around it.",
  },
  {
    no: 7,
    code: "ENV-07",
    domain: "Cyber Safety",
    title: "PhishGuard",
    icon: "shield",
    statement:
      "A school IT department is worried. Students routinely click suspicious links, share passwords, and fall for fake login pages, putting accounts and school systems at risk. Lectures on cyber safety do not stick. They want an interactive simulator that safely puts students inside realistic phishing scenarios — a fake email, a spoofed login, a too-good prize — and teaches them to spot the warning signs by doing, then scores their instincts and explains every miss. It must feel like a game students want to replay, not a compliance chore.",
    whyThisMatters:
      "People learn security by being safely fooled once, not by being warned a hundred times. Simulation builds instinct that lectures cannot.",
    targetUsers: [
      "School & college students",
      "Teachers & staff",
      "IT administrators",
      "Parents",
    ],
    objectives: [
      "Teach phishing detection by doing",
      "Score and explain user choices",
      "Cover common attack types",
      "Make learning replayable",
    ],
    mandatoryFeatures: [
      "Simulated phishing scenarios",
      "Spot-the-red-flag interactions",
      "Score with per-choice feedback",
      "Progress across scenario levels",
    ],
    bonusFeatures: [
      "Password-strength mini-game",
      "Leaderboard by class",
      "Printable safety cheat-sheet",
    ],
    bonusChallenge:
      "Add an “inbox mode” that mixes real-looking safe and malicious messages and grades how many a student correctly keeps or deletes under a timer.",
  },
  {
    no: 8,
    code: "ENV-08",
    domain: "Finance",
    title: "PocketWise",
    icon: "wallet",
    statement:
      "A parents' association has asked for a tool. Their teenagers receive allowances and spend impulsively, with no sense of where the money goes until it is gone, and no habit of saving. They want a simple expense tracker built for students: quick to log spends, honest about spending patterns, and encouraging about saving toward a goal. It should turn abstract money into clear visuals a teenager understands at a glance and gently nudge better decisions without feeling like a lecture from a parent or a bank.",
    whyThisMatters:
      "Money habits form early. Without visibility, small daily spends quietly erase savings, and no one teaches teenagers to notice.",
    targetUsers: [
      "School & college students",
      "Parents setting allowances",
      "First-time earners",
      "Student clubs managing funds",
    ],
    objectives: [
      "Make spending visible",
      "Encourage saving toward goals",
      "Reveal spending patterns",
      "Build early money habits",
    ],
    mandatoryFeatures: [
      "Quick expense logging",
      "Category spending breakdown",
      "Savings goal with progress",
      "Weekly/monthly summaries",
    ],
    bonusFeatures: ["Budget limit alerts", "Savings streaks", "Shared club/group wallet view"],
    bonusChallenge:
      "Build a “what if I skip this” insight that shows the yearly cost of a recurring small spend and how fast cutting it reaches the user's savings goal.",
  },
  {
    no: 9,
    code: "ENV-09",
    domain: "Food Waste",
    title: "PlateShare",
    icon: "utensils",
    statement:
      "A network of restaurants and NGOs has approached you. Every night, eateries discard trays of edible surplus food while nearby shelters go short, because there is no fast, trusted way to connect the two before the food spoils. They want a platform where a restaurant can post surplus in seconds, nearby verified NGOs claim it, and a simple handoff is coordinated with pickup windows and safe-handling notes. It must be quick enough to use at closing time and build enough trust that both sides show up.",
    whyThisMatters:
      "Edible surplus and hunger often sit blocks apart. The missing piece is not food or need, but a trusted, timely connection.",
    targetUsers: [
      "Restaurants & caterers",
      "Food-relief NGOs",
      "Volunteer drivers",
      "Community shelters",
    ],
    objectives: [
      "Connect surplus to NGOs fast",
      "Coordinate safe, timely pickup",
      "Build trust between parties",
      "Cut edible-food wastage",
    ],
    mandatoryFeatures: [
      "Post surplus with quantity & time",
      "NGO claim & pickup scheduling",
      "Verified donor/NGO profiles",
      "Safe-handling & freshness notes",
    ],
    bonusFeatures: [
      "Distance-based NGO matching",
      "Impact meals-saved counter",
      "Volunteer driver assignment",
    ],
    bonusChallenge:
      "Add a “freshness clock” on every posting that visibly counts down the safe window and auto-alerts the nearest NGO as time runs low.",
  },
  {
    no: 10,
    code: "ENV-10",
    domain: "Mental Health",
    title: "MindEase",
    icon: "message",
    statement:
      "A school counselling team has reached out. Many students quietly struggle with stress and low mood but never seek help, and the team cannot spot who needs support until a crisis. They want a private mood journal where a student can check in daily in seconds, notice their own patterns over time, and receive gentle, practical wellness suggestions. Everything must feel safe and confidential — no judgement, no exposure — while optionally helping a student recognise when it is time to talk to someone they trust.",
    whyThisMatters:
      "Emotional wellbeing is invisible until it breaks. A private, low-effort habit of noticing feelings helps students help themselves early.",
    targetUsers: [
      "School & college students",
      "Counsellors (aggregate view)",
      "Students under exam stress",
      "Anyone building self-awareness",
    ],
    objectives: [
      "Enable quick private check-ins",
      "Reveal mood patterns over time",
      "Offer practical wellness tips",
      "Encourage seeking help early",
    ],
    mandatoryFeatures: [
      "Daily mood & note check-in",
      "Private mood-history view",
      "Trend visualisation over time",
      "Contextual wellness suggestions",
    ],
    bonusFeatures: [
      "Guided breathing exercise",
      "Gratitude / journaling prompts",
      "Gentle “reach out” nudge on low streaks",
    ],
    bonusChallenge:
      "Design a private pattern insight that, without alarming the user, highlights recurring low-mood triggers (e.g. certain days) and suggests one small change.",
  },
  {
    no: 11,
    code: "ENV-11",
    domain: "Transportation",
    title: "BusTrack",
    icon: "bus",
    statement:
      "A school transport office is overwhelmed with calls asking where the bus is. With no GPS hardware and no internet available to you, build the office's side of the answer: a route and timing system that stores every bus, its stop sequence, and its scheduled times, then simulates a run so the coordinator can see where each bus should be right now and which stops are still ahead. When a driver radios in a delay, the coordinator enters it once and every downstream stop time updates automatically.",
    whyThisMatters:
      "A missing bus is a safety problem, not an inconvenience. Even without tracking hardware, accurate schedules and fast delay maths remove most of the panic.",
    targetUsers: [
      "School transport coordinators",
      "Parents & guardians",
      "Students",
      "Drivers",
    ],
    objectives: [
      "Model routes, stops & times",
      "Show expected position now",
      "Recalculate on reported delay",
      "Give staff one clear overview",
    ],
    mandatoryFeatures: [
      "Define buses, routes & stop times",
      "Simulated run showing progress",
      "Enter a delay → times recalculate",
      "School-wide route dashboard",
    ],
    bonusFeatures: [
      "Per-stop printable timetable",
      "Boarded / alighted roll check",
      "Clash warning for double-booked buses",
    ],
    bonusChallenge:
      "Add a delay ripple view that shows, for one reported hold-up, exactly which stops and how many students are affected.",
  },
  {
    no: 12,
    code: "ENV-12",
    domain: "Women Safety",
    title: "SafeRoute",
    icon: "pin",
    statement:
      "A women's safety collective has approached your team. People walking alone at night have no way to choose a route that is well-lit, busy and near help rather than merely shortest. Working from a stored map of a neighbourhood — streets, lighting, open shops, police posts — build a planner that scores each possible path on safety as well as distance and recommends the safer one, explaining why. It must run entirely on the device, and a trusted-contact card with a written route plan should be printable or savable before setting out.",
    whyThisMatters:
      "The shortest path is not always the safest. Encoding local knowledge about light and footfall turns a guess into an informed choice.",
    targetUsers: [
      "Women & solo commuters",
      "Students travelling late",
      "Trusted contacts",
      "Community safety volunteers",
    ],
    objectives: [
      "Score routes on safety, not just distance",
      "Explain why a route is safer",
      "Record unsafe spots locally",
      "Work with no network",
    ],
    mandatoryFeatures: [
      "Safety-weighted route planner",
      "Reason shown for each recommendation",
      "Mark & store an unsafe location",
      "Safe-points shown along the route",
    ],
    bonusFeatures: [
      "Well-lit vs. shortest comparison",
      "Savable route plan for a contact",
      "Time-of-day changes the scoring",
    ],
    bonusChallenge:
      "Add a night mode that re-scores every route after dark, since a busy daytime shortcut can be the worst choice at 10 PM.",
  },
  {
    no: 13,
    code: "ENV-13",
    domain: "Smart City",
    title: "CivicFix",
    icon: "building",
    statement:
      "A city corporation needs a better complaints system. Residents spot potholes, broken streetlights, and overflowing bins daily, but reporting means unclear helplines and complaints that vanish with no update, so people stop bothering. They want a civic issue reporting portal where a resident reports a problem with a photo and location in under a minute, tracks its status transparently, and sees it routed to the right department. Officials get an organised queue instead of chaos. It should rebuild trust that reporting actually leads to a fix.",
    whyThisMatters:
      "Cities do not lack willing citizens — they lack a channel where reporting is quick and where a report visibly leads somewhere.",
    targetUsers: [
      "City residents",
      "Municipal departments",
      "Ward officers",
      "Resident associations",
    ],
    objectives: [
      "Make reporting fast & clear",
      "Route issues to right teams",
      "Show transparent status",
      "Rebuild trust in the system",
    ],
    mandatoryFeatures: [
      "Report with photo file & location",
      "Category-based routing",
      "Status tracking per complaint",
      "Official queue/dashboard view",
    ],
    bonusFeatures: [
      "Upvote recurring local issues",
      "Resolution-time statistics",
      "Hotspot view on a stored map",
    ],
    bonusChallenge:
      "Build a public “resolution ledger” showing average fix times per category and ward, so citizens can see which issues get solved fastest.",
  },
  {
    no: 14,
    code: "ENV-14",
    domain: "Tourism",
    title: "HeritageQR",
    icon: "home",
    statement:
      "A heritage tourism board has approached you. Visitors wander historical sites reading little more than a faded plaque, missing the stories that make a place matter, and guides are scarce. They want a QR-based digital guide: a visitor scans a code at any point of interest and instantly gets rich, layered context — history, significance, and a short narrated story — in their language, at their own pace. It should deepen the visit without a physical guide, work for large groups, and gently encourage exploring the whole site.",
    whyThisMatters:
      "A monument without its story is just old stone. Contextual, on-demand information turns passive sightseeing into real understanding.",
    targetUsers: [
      "Tourists & families",
      "School excursion groups",
      "Heritage-site staff",
      "Local guides",
    ],
    objectives: [
      "Deliver rich context on scan",
      "Support multiple languages",
      "Encourage full-site exploration",
      "Reduce dependence on guides",
    ],
    mandatoryFeatures: [
      "Scan or enter a code → point-of-interest info",
      "Layered history & significance",
      "Language selection",
      "Site map with visited markers",
    ],
    bonusFeatures: [
      "Bundled audio narration",
      "Suggested walking trail",
      "Quiz to test what visitors learned",
    ],
    bonusChallenge:
      "Design a self-guided “trail mode” that sequences QR points into a story-driven walk and celebrates completing the full route.",
  },
  {
    no: 15,
    code: "ENV-15",
    domain: "Wildlife",
    title: "RescueLink",
    icon: "paw",
    statement:
      "An animal welfare NGO needs a coordination tool. When citizens find an injured bird or stray animal, they do not know whom to call, and by the time help is arranged the animal has moved or worsened. They want a reporting and coordination platform: a finder reports an injured animal with a photo and location in seconds, nearby volunteers and rescue centres are alerted, and someone claims the case so effort is not duplicated. It must be fast, work for anxious first-time reporters, and keep the finder updated until help arrives.",
    whyThisMatters:
      "Most injured animals are found by ordinary passers-by who want to help but have nowhere to turn quickly enough to matter.",
    targetUsers: [
      "Citizens & passers-by",
      "Rescue volunteers",
      "Animal shelters / vets",
      "NGO coordinators",
    ],
    objectives: [
      "Enable fast injury reports",
      "Alert nearby rescuers",
      "Prevent duplicated effort",
      "Keep finders informed",
    ],
    mandatoryFeatures: [
      "Log a case with photo file & location",
      "Match to nearest listed volunteer",
      "Case claim & status updates",
      "First-aid guidance for finders",
    ],
    bonusFeatures: ["Animal-type filtering", "Rescue outcome log", "Volunteer availability toggle"],
    bonusChallenge:
      "Add a dispatch board that assigns each open case to the closest available volunteer from the local register and flags any case unclaimed too long.",
  },
  {
    no: 16,
    code: "ENV-16",
    domain: "Energy",
    title: "WattWise",
    icon: "zap",
    statement:
      "A utility company has approached your team. Families receive a single monthly bill and have no idea which appliances or habits drive their consumption, so they cannot save even when they want to. You will be given a sample meter-reading file. Build a dashboard that loads that file from disk and turns it into clear, friendly breakdowns — by appliance, by time of day, versus last month — plus concrete, ranked recommendations to cut waste. No meters to connect to and no internet: the file on disk is your data source.",
    whyThisMatters:
      "You cannot manage what you cannot see. Households waste energy not from indifference but from total lack of feedback.",
    targetUsers: [
      "Households",
      "Cost-conscious families",
      "Facilities managers",
      "School energy clubs",
    ],
    objectives: [
      "Read usage from a local file",
      "Break usage down clearly",
      "Recommend concrete savings",
      "Turn data into action",
    ],
    mandatoryFeatures: [
      "Load the provided reading file",
      "Breakdown by appliance & time",
      "Month-over-month comparison",
      "Ranked savings recommendations",
    ],
    bonusFeatures: [
      "Estimated ₹ saved per tip",
      "High-usage warnings",
      "Goal-setting for reduction",
    ],
    bonusChallenge:
      "Build a “phantom load” finder that highlights consumption during hours the household is asleep or away and suggests what to switch off.",
  },
  {
    no: 17,
    code: "ENV-17",
    domain: "Community Service",
    title: "VolunteerConnect",
    icon: "users",
    statement:
      "A coalition of NGOs has asked for help. They constantly need volunteers but struggle to reach them, while many people willing to help cannot find opportunities that match their time and skills. They want a volunteer discovery and event platform where NGOs post opportunities, and volunteers browse, filter, and sign up in minutes, then track the hours they contribute. It should make helping feel easy and rewarding, help NGOs fill roles reliably, and build a community that keeps coming back.",
    whyThisMatters:
      "Willingness to help is abundant; matching it to the right opportunity at the right time is the part that keeps breaking.",
    targetUsers: [
      "Prospective volunteers",
      "NGOs & charities",
      "Student service groups",
      "Event coordinators",
    ],
    objectives: [
      "Match volunteers to needs",
      "Make sign-up effortless",
      "Track contributed hours",
      "Build a returning community",
    ],
    mandatoryFeatures: [
      "Coordinators post opportunities",
      "Browse & filter by skill/time",
      "Quick sign-up flow",
      "Volunteer hour tracking",
    ],
    bonusFeatures: [
      "Printable contribution certificates",
      "Skill-based recommendations",
      "Roster & check-in sheet",
    ],
    bonusChallenge:
      "Design a “who can cover this?” view that takes an urgent opportunity and lists every registered volunteer whose stored availability and skills fit.",
  },
  {
    no: 18,
    code: "ENV-18",
    domain: "Sports",
    title: "FixturePro",
    icon: "trophy",
    statement:
      "A school sports department is drowning in spreadsheets. Organising tournaments means manually drawing fixtures, chasing scores, and recomputing standings, which is slow and error-prone, and players never know what is happening next. They want a tournament management system that generates fixtures from a list of teams, records scores as matches finish, and updates brackets and standings automatically. It should give organisers control and give players and spectators a clear, live view of the tournament — who plays next, and who is winning.",
    whyThisMatters:
      "Manual tournament management collapses under its own paperwork; a single late score can throw an entire day's schedule into confusion.",
    targetUsers: [
      "Sports coordinators",
      "Team captains & players",
      "Spectators & parents",
      "Referees / scorekeepers",
    ],
    objectives: [
      "Auto-generate fixtures",
      "Record scores easily",
      "Update standings instantly",
      "Give everyone a clear view",
    ],
    mandatoryFeatures: [
      "Add teams & generate fixtures",
      "Enter results per match",
      "Auto-updated bracket/standings",
      "Schedule of upcoming matches",
    ],
    bonusFeatures: [
      "Group + knockout formats",
      "Top-scorer / MVP tracking",
      "Printable results sheet",
    ],
    bonusChallenge:
      "Build a scheduler that fits all matches into limited grounds and time slots without clashing a team into two games at once.",
  },
  {
    no: 19,
    code: "ENV-19",
    domain: "Public Safety",
    title: "FoundIt",
    icon: "search",
    statement:
      "A school administration needs a solution. Hundreds of belongings — water bottles, jackets, calculators, ID cards — are lost each year, pile up in an unsorted lost-and-found cupboard, and are rarely reunited with owners. They want a searchable Lost & Found portal where staff log found items with a photo and details, students search and claim what is theirs, and post about things they have lost so a match can be flagged. It should clear the clutter, return belongings, and make an annoying, wasteful problem quietly disappear.",
    whyThisMatters:
      "Most lost items are never reclaimed simply because no one can search a cupboard — visibility alone reunites the majority.",
    targetUsers: ["Students", "School office & staff", "Parents", "Hostel / campus wardens"],
    objectives: [
      "Log found items clearly",
      "Let owners search & claim",
      "Match lost-item posts",
      "Clear the clutter efficiently",
    ],
    mandatoryFeatures: [
      "Log found item + photo file/details",
      "Search & filter found items",
      "Post a lost-item request",
      "Claim & mark-returned flow",
    ],
    bonusFeatures: [
      "Suggested lost↔found matches",
      "Category & location tagging",
      "Unclaimed-item aging report",
    ],
    bonusChallenge:
      "Add a smart matcher that, when a lost-item post is created, instantly suggests likely matches from logged found items by category and description.",
  },
  {
    no: 20,
    code: "ENV-20",
    domain: "Space Technology",
    title: "MarsBase",
    icon: "rocket",
    statement:
      "A space-education institute has set your team a challenge. A future Mars habitat must survive on tightly limited oxygen, water, power, and food, and mismanaging any one resource endangers the whole crew — yet there is no intuitive way for students to grasp these trade-offs. They want a simulation dashboard where a user allocates resources across a colony's needs, sees the consequences play out day by day, and learns to balance survival against growth. It should be genuinely educational, visually clear, and tense enough that every decision feels to matter.",
    whyThisMatters:
      "Resource allocation under hard limits is the core of survival engineering — and a vivid, safe way to teach systems thinking.",
    targetUsers: [
      "Students & STEM learners",
      "Educators",
      "Simulation & game enthusiasts",
      "Science-club teams",
    ],
    objectives: [
      "Model interdependent resources",
      "Show consequences of choices",
      "Balance survival vs. growth",
      "Teach systems thinking",
    ],
    mandatoryFeatures: [
      "Allocate oxygen, water, power, food",
      "Day-by-day simulation of outcomes",
      "Warnings when a resource runs low",
      "Colony status dashboard",
    ],
    bonusFeatures: [
      "Random events (dust storm, leak)",
      "Population growth mechanics",
      "Score for days survived",
    ],
    bonusChallenge:
      "Introduce a surprise “solar storm” that cuts power generation for several days and challenges the user to keep the colony alive through rationing.",
  },
];

export function briefByNo(no: number | null | undefined): Brief | null {
  if (!no) return null;
  return BRIEFS.find((b) => b.no === no) ?? null;
}
