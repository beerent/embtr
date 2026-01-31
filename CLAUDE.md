# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Embtr is a habit tracking web application built with Next.js 16 (App Router) and PostgreSQL via Prisma. Users create habits, schedule them on specific weekdays, plan daily tasks, track completion with quantity support, and maintain streaks.

## Commands

```bash
npm run dev              # Dev server with Turbopack
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest watch mode
npm run test:run         # Vitest single run
npm run test:e2e         # Playwright e2e tests
npm run test:e2e:ui      # Playwright interactive UI
npm run migrate:deploy   # Deploy Prisma migrations
npx prisma migrate dev   # Create new migration during development
npx prisma generate      # Regenerate Prisma client after schema changes
```

## Architecture

### Source Layout (`src/`)

- **`app/`** — Next.js App Router. Routes grouped under `(frontend)/(secure)/` (authenticated) and `(frontend)/(insecure)/` (public). Shared UI lives in `_components/`.
- **`server/`** — All server-side logic. Uses `'use server'` directive for server actions.
  - `auth/` — Password hashing (scryptSync + salt), HMAC-SHA256 session cookies
  - `database/` — DAO classes extending `BaseDao` with Prisma transactions and timezone utilities
  - `completion/` — Pure functions for day status, scoring, and streak computation (most unit-tested code)
  - `session/` — `getSession()` helper to retrieve authenticated user
- **`client/`** — Zustand stores (`SessionStore`, `ThemeStore`) and React context providers
- **`shared/`** — Types and utilities used by both server and client
- **`middleware.ts`** — Route protection; redirects unauthenticated users to `/signin`

### Key Patterns

- **DAO pattern**: Database access goes through DAO classes (`UserDao`, `HabitDao`, etc.) that extend `BaseDao`. `BaseDao` provides timezone-aware date utilities and Prisma transaction support.
- **Server actions**: Mutations are implemented as server actions in `actions.ts` files within feature directories. Input is validated with Zod schemas.
- **Prisma singleton**: `src/server/database/prisma/prisma.ts` — singleton client with query timing logs (warnings >100ms, errors >500ms).
- **Client state**: Zustand with namespace pattern (`SessionStore.useStore()`). SWR for data fetching.
- **Pure business logic**: `CompletionService.ts` contains pure functions with no DB dependencies, making them directly unit-testable.
- **CSS Modules**: Component styles use `.module.css` files.

### Path Aliases (tsconfig)

```
@/*       → src/*
@client/* → src/client/*
@server/* → src/server/*
@shared/* → src/shared/*
@prisma/* → prisma/*
```

### Database

PostgreSQL via Supabase. Prisma schema at `prisma/schema.prisma`. Core models: User, Habit, ScheduledHabit, PlannedDay, PlannedTask, HabitStreak, DayResult, Comment, Like. Uses pgBouncer for connection pooling (`DATABASE_URL`) with a separate direct connection for migrations (`DIRECT_URL`).

### Environment Variables

Defined in `.env.example`:
- `DATABASE_URL` — PostgreSQL connection string (pgBouncer)
- `DIRECT_URL` — Direct PostgreSQL connection (for migrations)
- `SESSION_SECRET` — HMAC key for session cookie signing
- `NEXT_PUBLIC_BASE_URL` — Public base URL (exposed to client)

### Testing

- **Unit tests** (Vitest): Located in `__tests__/` directories alongside source. Currently focused on `CompletionService` (~40 test cases covering scoring, streaks, hard mode).
- **E2E tests** (Playwright): Located in `e2e/`. Tests run sequentially (single worker), Chrome only. Auth state is stored in `e2e/.auth/user.json` via a global setup project. Dev server auto-starts on port 3000.
