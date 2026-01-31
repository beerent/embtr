# embtr Web: Deep Dive & MVP Plan

---

# Part 1: MVP Plan

## Vision

Rebuild embtr as a simplified web app. Same brand, same core premise (habit tracking + daily planning), but stripped down to three pillars:

1. **Profile** -- Your public hub. Shows your planned habits, achievements, streaks, charts, trophies.
2. **Calendar** -- Your command center. Daily, weekly, and monthly views to plan and track habits. Borrowed directly from Flowbase's calendar component.
3. **Timeline** -- The social feed. Share completed days, browse others' results, like and comment.

## Architecture (Borrowed from Flowbase2)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 16** (App Router, Turbopack) | Same as Flowbase |
| UI | **React Bootstrap** + CSS Modules | Same patterns, same theme system |
| Auth | **Supabase Auth** | Google + Apple + email sign-in |
| Database | **Prisma** + PostgreSQL (Supabase) | Simplified schema from embtr |
| Data Fetching | **SWR** (client) + Server Actions (server) | Same Flowbase pattern |
| State | **Zustand** (client state) | Same Flowbase pattern |
| Styling | Bootstrap 5.3 + CSS Modules + CSS Variables | Dark/light theme support |
| Icons | Boxicons / Remix Icons | Same as Flowbase |
| File Storage | Supabase Storage | Profile photos, post images |

### Directory Structure (Following Flowbase Conventions)

```
src/
  app/
    (frontend)/
      (insecure)/             # Public / no auth required
        signin/
        signup/
        landing/
      (secure)/               # Auth required
        _components/          # Shared layout (sidebar, header, theme)
          layout/modern/      # ModernLayout, ModernSidebar, ModernHeader
        dashboard/            # Home / today overview
        calendar/             # Calendar page (day/week/month views)
        profile/              # Current user's profile
        profile/[username]/   # Public profile view
        timeline/             # Social timeline feed
        settings/             # User settings
  client/
    component/                # Reusable UI components
    service/                  # SWR-based data fetching
    server_actions/           # Server action wrappers
    store/                    # Zustand stores
    hook/                     # Custom hooks
  server/
    database/                 # Prisma DAO layer
    service/                  # Business logic
    session/                  # Session management
  shared/
    types/                    # Shared TypeScript types
    util/                     # Shared utilities
prisma/
  schema.prisma
```

---

## Data Model (Simplified from embtr)

### Core Entities

```prisma
model User {
  id              Int       @id @default(autoincrement())
  uid             String    @unique                    // Supabase auth UID
  email           String    @unique
  username        String    @unique
  displayName     String?
  bio             String?
  photoUrl        String?
  bannerUrl        String?
  timezone        String    @default("America/New_York")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  scheduledHabits ScheduledHabit[]
  plannedDays     PlannedDay[]
  dayResults      DayResult[]
  comments        Comment[]
  likes           Like[]
  habitStreaks    HabitStreak[]
}

model Habit {
  // The "template" -- a habit definition (system or user-created)
  id              Int       @id @default(autoincrement())
  title           String
  description     String?
  icon            String?                              // icon class name (e.g., "bx bx-run")
  color           String    @default("#4f46e5")
  category        String    @default("General")
  userId          Int?                                 // null = system habit, set = custom
  user            User?     @relation(fields: [userId], references: [id])
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  scheduledHabits ScheduledHabit[]
  habitStreaks    HabitStreak[]
}

model ScheduledHabit {
  // A user's configured recurring schedule for a habit
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id])
  habitId         Int
  habit           Habit     @relation(fields: [habitId], references: [id])
  daysOfWeek      Int[]                                // [0=Sun, 1=Mon, ..., 6=Sat]
  timeOfDay       String    @default("ANY")            // MORNING, AFTERNOON, EVENING, NIGHT, ANY
  quantity        Float     @default(1)
  unit            String?                              // "minutes", "glasses", "reps", etc.
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  plannedTasks    PlannedTask[]
}

model PlannedDay {
  // A specific calendar date for a user
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id])
  dayKey          String                               // "2024-01-15"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  plannedTasks    PlannedTask[]
  dayResult       DayResult?

  @@unique([userId, dayKey])
}

model PlannedTask {
  // A concrete habit instance on a specific day
  id              Int       @id @default(autoincrement())
  plannedDayId    Int
  plannedDay      PlannedDay @relation(fields: [plannedDayId], references: [id])
  scheduledHabitId Int?
  scheduledHabit  ScheduledHabit? @relation(fields: [scheduledHabitId], references: [id])
  title           String                               // Denormalized for display
  icon            String?
  color           String?
  timeOfDay       String    @default("ANY")
  quantity        Float     @default(1)
  completedQuantity Float   @default(0)
  unit            String?
  status          String    @default("INCOMPLETE")     // INCOMPLETE, COMPLETE, SKIPPED, FAILED
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model HabitStreak {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id])
  habitId         Int
  habit           Habit     @relation(fields: [habitId], references: [id])
  currentStreak   Int       @default(0)
  longestStreak   Int       @default(0)
  updatedAt       DateTime  @updatedAt

  @@unique([userId, habitId])
}

// --- Social / Timeline ---

model DayResult {
  // A shareable summary of a completed day (posted to timeline)
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id])
  plannedDayId    Int       @unique
  plannedDay      PlannedDay @relation(fields: [plannedDayId], references: [id])
  title           String?
  body            String?
  imageUrls       String[]                             // Array of image URLs
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  likes           Like[]
  comments        Comment[]
}

model Comment {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id])
  dayResultId     Int
  dayResult       DayResult @relation(fields: [dayResultId], references: [id])
  body            String
  createdAt       DateTime  @default(now())
}

model Like {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id])
  dayResultId     Int
  dayResult       DayResult @relation(fields: [dayResultId], references: [id])
  createdAt       DateTime  @default(now())

  @@unique([userId, dayResultId])
}
```

---

## Three Pillars -- Feature Breakdown

### Pillar 1: Profile (`/profile` and `/profile/[username]`)

**What it shows (publicly visible):**

- **Header**: Display name, username, avatar, banner image, bio, member since date
- **Stats bar**: Current streak (longest habit streak), Total days completed, Habits tracked
- **Habit list**: Active scheduled habits (icon, title, schedule summary like "Mon/Wed/Fri, Mornings")
- **Streak display**: Per-habit streaks with visual tier indicators (fire icons, color tiers from embtr)
- **Completion chart**: A GitHub-style contribution heatmap or simple bar chart showing daily completion rate over the last 90 days (ApexCharts, already in Flowbase deps)
- **Recent activity**: Last few DayResults (mini-cards linking to timeline)
- **Trophies section**: Earned streak tier badges displayed as a grid

**Borrowing from embtr**: Profile structure, streak tiers, habit display, completion history concept
**Borrowing from Flowbase**: Page layout, card components, chart components (ApexCharts), Bootstrap styling

### Pillar 2: Calendar (`/calendar`)

**Directly adapted from Flowbase's `/tasks` calendar component.**

- **Three views**: Month, Week, Day (ViewSwitcher component)
- **Month view**: Grid of days, each showing planned habits as color-coded cards (icon + title). Completion status shown via left border color (same pattern as Flowbase tasks). Click a day to see full detail.
- **Week view**: 7-column layout with time-of-day rows (Morning/Afternoon/Evening/Night instead of hourly slots). Habits placed in their scheduled time blocks. Swipe/click to mark complete.
- **Day view**: Single day focus. Full list of planned tasks grouped by time of day. Each task shows: icon, title, quantity progress (e.g., "5/8 glasses"), status toggles (complete/skip/fail). This is the primary "do your habits" screen.
- **Navigation**: Month/week/day picker at top, today button, prev/next navigation
- **Quick add**: Click empty time slot to add a one-time task
- **Auto-populate**: Scheduled habits auto-fill into each day based on their day-of-week config

**Borrowing from embtr**: PlannedDay/PlannedTask data model, time-of-day grouping, completion statuses, habit auto-population logic
**Borrowing from Flowbase**: TaskCalendar, MonthView, WeekView, DayView components, CSS Modules, ViewSwitcher, navigation controls, color-coding system

### Pillar 3: Timeline (`/timeline`)

**A public feed of completed days.**

- **Feed**: Reverse-chronological list of DayResult posts from all users
- **DayResult card**: User avatar + name (links to profile), date, title/body text, images (carousel if multiple), completion summary (e.g., "Completed 7/8 habits"), like count + comment count
- **Like button**: Toggle like (optimistic update via SWR mutation, same as Flowbase patterns)
- **Comments**: Expandable comment section below each post. Simple text comments with user avatar + name + timestamp.
- **Share a day**: From the calendar's day view, a "Share Day" button creates a DayResult post. User can add a title, body text, and photos before posting.
- **Detail view** (`/timeline/[id]`): Full-page view of a single DayResult with all comments visible

**Borrowing from embtr**: PlannedDayResult concept, timeline feed, likes/comments, daily summary sharing
**Borrowing from Flowbase**: Card layout patterns, Timeline component, data table patterns for the feed, optimistic SWR updates

---

## MVP Build Phases

### Phase 1: Foundation
- Next.js project setup (clone/adapt Flowbase structure)
- Supabase project + auth (Google sign-in)
- Prisma schema + initial migration
- Layout scaffolding (ModernLayout sidebar with 4 nav items: Dashboard, Calendar, Timeline, Profile)
- Basic dark/light theme (from Flowbase)
- Session/auth flow (sign in, sign up, protected routes)

### Phase 2: Habits & Calendar
- Habit model + CRUD (create custom habits, browse/manage)
- ScheduledHabit model + CRUD (configure days, times, quantity)
- PlannedDay + PlannedTask auto-population logic (server-side: given a date range, generate planned tasks from active scheduled habits)
- Calendar component adapted from Flowbase (Month/Week/Day views)
- Day view: display planned tasks, mark complete/skip/fail, update quantity
- Streak calculation logic (on task completion, update HabitStreak)

### Phase 3: Profile
- Public profile page (`/profile/[username]`)
- Stats bar (streak, days completed, habits tracked)
- Active habits list
- Streak display with tier badges
- Completion heatmap chart (ApexCharts)
- Profile editing (avatar, banner, bio, display name)

### Phase 4: Timeline & Social
- DayResult model + CRUD (share a completed day)
- Timeline feed page (paginated, reverse-chronological)
- DayResult cards (user info, completion summary, images, like/comment counts)
- Like toggle (optimistic)
- Comment thread (create + list)
- Detail view for a single post
- "Share Day" flow from calendar day view

---

## Navigation (Sidebar)

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| `bx bx-home` | Dashboard | `/dashboard` | Today's overview (today's tasks, current streaks, quick stats) |
| `bx bx-calendar` | Calendar | `/calendar` | Day/Week/Month planning views |
| `bx bx-globe` | Timeline | `/timeline` | Social feed of completed days |
| `bx bx-user` | Profile | `/profile` | Your public profile |
| `bx bx-cog` | Settings | `/settings` | Account settings, preferences |

---

## What We're Intentionally Leaving Out (for MVP)

From the original embtr, these are cut to keep things simple:

- **Challenges** -- No community challenges, milestones, or awards
- **Points & Levels** -- No point system or level progression (streaks are enough gamification)
- **Widgets / Widget Marketplace** -- No customizable dashboard widgets
- **Push Notifications** -- No mobile push (web-only for now)
- **Premium / Monetization** -- No paywall or subscription tier
- **Away Mode** -- No pause tracking feature
- **Tutorial Island** -- No guided onboarding (simple enough to not need it)
- **User Search** -- No user discovery (share profiles via URL)
- **User Blocking** -- Not needed at MVP scale
- **Quote of the Day** -- Cut for simplicity
- **Feature Voting** -- Cut for simplicity
- **Real-time (WebSocket)** -- Standard request/response is fine for MVP
- **Leaderboard** -- Cut for MVP (could add later)

---

# Part 2: Original App Deep Dive

## What is embtr?

**embtr is a habit tracking and daily planning application** focused on helping users build consistent routines. The core premise: define the habits you want to build, schedule them across your week, then check them off each day. The app gamifies this with streaks, points, levels, challenges, and a social timeline so users can share progress and support each other.

- **Mobile app**: React Native / Expo (iOS + Android)
- **Server**: Express.js + Prisma ORM + MySQL
- **Auth**: Firebase Authentication (Google + Apple sign-in)
- **Notifications**: Expo push notifications
- **Monetization**: RevenueCat (premium subscription)
- **Real-time**: Socket.io for live updates
- **Active development**: v0.0.1 (Dec 2021) through v5.0.29 (Feb 2024) -- 346+ releases

---

## Core Concepts

### 1. Tasks (Habit Definitions)

A **Task** is a reusable habit template. It has a title, description, icon, and category. Tasks can be system-provided (from a habit library) or user-created custom habits.

Examples: "Drink Water", "Exercise", "Read", "Meditate"

Each task belongs to a **HabitCategory** (e.g., Health, Fitness, Mindfulness), and has an **Icon** for visual identification.

### 2. Scheduled Habits

A **ScheduledHabit** is a user's personalized schedule for a task. It defines:

- **Which task** (links to a Task)
- **Days of the week** the habit repeats (e.g., Mon/Wed/Fri)
- **Times of day** (Morning, Afternoon, Evening, Night, or Any Time)
- **Quantity + Unit** (e.g., 8 glasses, 30 minutes, 5 miles)
- **Start/End dates** (optional bounds for the schedule)

This is the bridge between "I want to build this habit" and "here's when I'll do it."

### 3. Planned Days & Planned Tasks

A **PlannedDay** represents a specific calendar date for a user (keyed by `dayKey` like `"2024-01-15"`). Each planned day contains **PlannedTasks** -- the concrete instances of scheduled habits for that date.

Each PlannedTask tracks:
- **Status**: incomplete, complete, skipped, or failed
- **Quantity**: target vs. completed (e.g., completed 6 of 8 glasses)
- **Time of day**: when the task is slotted

This is the daily execution layer -- "what do I need to do today, and did I do it?"

### 4. Habit Streaks

**HabitStreaks** track consecutive days of habit completion. Streaks have **tiers** (e.g., Bronze at 7 days, Silver at 30 days, Gold at 90 days) with visual indicators (colors, icons, badges). Streaks are tracked per-task and per-user.

### 5. Challenges

**Challenges** are community-driven goals with:
- A **creator** (any user)
- **Requirements** (which tasks, how many times, calculation type: total or unique days)
- **Milestones** (intermediate checkpoints)
- **Participants** (users who join)
- **Awards** (earned on completion)
- **Start/end dates**
- **Tags** for categorization and filtering

### 6. Points & Levels

A gamification layer where users earn points for:
- Completing habits
- Maintaining streaks
- Participating in challenges
- Other defined actions

Points accumulate toward **Levels** (each level has a min/max point threshold and a badge). A **PointLedgerRecord** tracks every point transaction.

### 7. Social / Timeline

The social layer includes:
- **PlannedDayResults**: Shareable summaries of a completed day (title, description, images)
- **UserPosts**: Freeform social posts (title, body, images)
- **FeaturedPosts**: Admin/system-highlighted content
- **Likes** and **Comments** on all post types
- **Notifications** for social interactions (likes, comments, challenge activity)
- **User tagging** in comments

### 8. Widgets

The dashboard is widget-based and customizable. Available widgets:
- **Today's Tasks** -- current day's habit list
- **Planning** -- calendar picker + day plan view
- **Daily History** -- past day results
- **Habit Journey** -- progress visualization
- **Habit Streaks** -- streak status display
- **Active Challenges** -- ongoing challenges
- **Quote of the Day** -- motivational quotes
- **Today's Notes** -- daily notes
- **Today's Photos** -- daily photo journal
- **Time Left in Day** -- countdown timer
- **Points** -- current points/level display
- **Trophy Case** -- earned badges/awards
- **Pillars** -- life category overview

Users can enable/disable and reorder widgets via a **Widget Marketplace**.

---

## App Navigation (5 Tabs)

| Tab | Purpose | Key Screens |
|-----|---------|-------------|
| **Timeline** | Social feed of community activity | Timeline, UserPostDetails, PlannedDayResultDetails, ChallengeDetailsView |
| **My Habits** | Manage habit definitions and schedules | ManageHabits, CreateEditScheduledHabit, HabitDetails, HabitSummaryDetails, AddHabitCategories |
| **Today** (default/home) | Plan and track today's habits | Today (PlanningWidget w/ calendar + task list), PlanDay, EditPlannedHabit |
| **Journey** | View progress, challenges, milestones | Journey, ChallengeDetailsView, HabitStreakTierSummary, LevelSummary, Leaderboard |
| **Profile** | User profile, settings, trophy case | Profile, UserSettings, EditUserProfile, AwayMode, FeatureVote |

---

## Key User Flows

### Onboarding
1. Landing page -> Login (Google/Apple via Firebase)
2. Profile population (username, display name, photo)
3. Terms approval
4. **Tutorial Island** -- a guided walkthrough that teaches:
   - How to create/select habits
   - How to schedule habits (days of week, times of day)
   - How to view and complete today's tasks
   - How to navigate the app tabs

### Daily Usage (Core Loop)
1. Open app -> **Today** tab is default
2. See calendar picker at top (month/day selectors)
3. Below calendar: today's planned tasks (auto-populated from scheduled habits)
4. Tap tasks to mark complete, update quantity, skip, or fail
5. Optionally: add one-time tasks for today
6. Optionally: share a **PlannedDayResult** (daily summary with photos/notes) to the timeline

### Habit Management
1. Go to **My Habits** tab
2. Browse habit library by category or create custom habit
3. Configure schedule: which days, what times, quantity/unit, start/end date
4. Habits auto-populate into daily plans going forward

### Social / Community
1. Browse **Timeline** for community posts and day results
2. Like and comment on posts
3. Join or create **Challenges**
4. Track challenge progress against milestones
5. Earn **Awards** for completing challenges

### Progression
1. Complete habits daily to build **Streaks** (with tiered milestones)
2. Earn **Points** for completions
3. Level up through the **Level** system
4. Earn **Badges** for achievements
5. View trophies and badges in **Trophy Case**
6. Compare with others on the **Leaderboard**

---

## Data Model Summary

```
User
  |-- ScheduledHabit[] (my recurring habit schedules)
  |     |-- Task (the habit definition)
  |     |-- DayOfWeek[] (Mon, Tue, etc.)
  |     |-- TimeOfDay[] (Morning, Afternoon, etc.)
  |     |-- Unit? (glasses, minutes, miles, etc.)
  |
  |-- PlannedDay[] (my calendar days)
  |     |-- PlannedTask[] (concrete habit instances for that day)
  |     |     |-- status (incomplete/complete/skipped/failed)
  |     |     |-- quantity / completedQuantity
  |     |
  |     |-- PlannedDayResult[] (shareable day summaries)
  |
  |-- HabitStreak[] (per-task streak tracking)
  |
  |-- ChallengeParticipant[] (challenges I've joined)
  |     |-- Challenge
  |           |-- ChallengeRequirement[] (what tasks/quantities needed)
  |           |-- ChallengeMilestone[] (intermediate goals)
  |           |-- Award? (prize for completion)
  |
  |-- UserPost[] (social posts)
  |-- PointLedgerRecord[] (point transactions)
  |-- UserAward[] (earned awards)
  |-- UserBadge[] (earned badges)
  |-- Widget[] (dashboard customization)
  |-- Property[] (key-value user settings)
  |-- Notification[] (in-app notifications)
  |-- PushNotificationToken[] (push notification devices)
```

---

## Server Architecture

- **Express.js** REST API with versioned endpoints
- **Prisma ORM** with MySQL
- **Firebase Admin** for auth token verification
- **Expo Server SDK** for push notifications
- **Google Cloud Vision** (image processing)
- **Socket.io** for real-time updates
- **Zod** for request validation
- **Winston** for logging
- **Rate limiting** on endpoints

### Key API Domains (25+ endpoint groups)
- Account, User, User Properties
- Habits, Scheduled Habits, Planned Habits
- Planned Days, Planned Day Results
- Tasks, Units, Time of Day, Day of Week
- Challenges, Milestones, Awards, Badges
- Points, Levels, Leaderboard
- Timeline, User Posts, Featured Posts
- Notifications, Push Notifications
- Widgets, Quote of the Day
- Icons, Icon Categories, Tags
- Feature flags, Premium, Marketing, Reports

---

## Feature Inventory

### Core Features (habit tracking fundamentals)
- [ ] Habit library with categories and icons
- [ ] Custom habit creation
- [ ] Recurring schedule configuration (days of week, times of day)
- [ ] Quantity tracking with units (glasses, minutes, miles, etc.)
- [ ] Daily planning view with calendar picker
- [ ] Task completion (complete / skip / fail / partial quantity)
- [ ] One-time task creation for specific days
- [ ] Habit streaks with tiered milestones

### Gamification
- [ ] Points system with defined point types
- [ ] Level progression
- [ ] Badges and awards
- [ ] Trophy case display
- [ ] Leaderboard

### Social
- [ ] Social timeline feed
- [ ] Daily result sharing (text + images)
- [ ] Freeform user posts (text + images)
- [ ] Likes and comments
- [ ] User tagging in comments
- [ ] User profiles (bio, photo, banner)
- [ ] User search
- [ ] Block users
- [ ] Featured/promoted posts

### Challenges
- [ ] Create challenges with requirements
- [ ] Join community challenges
- [ ] Challenge milestones
- [ ] Challenge completion awards
- [ ] Challenge filtering by tags

### Dashboard / Widgets
- [ ] Customizable widget dashboard
- [ ] Widget marketplace (enable/disable/reorder)
- [ ] Multiple widget types (tasks, streaks, quotes, photos, etc.)

### Notifications
- [ ] Push notifications (reminders + social)
- [ ] In-app notification center
- [ ] Notification settings (reminder, social, warning categories)

### Other
- [ ] Away mode (pause tracking)
- [ ] Premium subscription (RevenueCat)
- [ ] Tutorial/onboarding flow (Tutorial Island)
- [ ] Quote of the Day
- [ ] Feature voting (user feedback)
- [ ] Dark mode / theme support
- [ ] Real-time updates (WebSocket)
