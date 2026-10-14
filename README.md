# Emerald Height Academy — Website & Multi-Role Portal

A production-ready tutorial centre website with three role-based portals (**Student**, **Tutor**, **Super Admin**), built with Next.js (App Router), TypeScript, Tailwind CSS + shadcn/ui, Drizzle ORM and Neon Postgres.

> **No online payments, ever.** Fees are handled offline at the centre. There is no checkout, invoice, receipt or payment-gate code anywhere in this project. Access is granted manually by the Super Admin.

## Status (build phases)

| Phase | Description | Status |
| --- | --- | --- |
| 1 | Setup, Tailwind, shadcn, env, Neon connection, Drizzle schema, migrations, seed | ✅ done |
| 2 | Auth, RBAC helpers, login, password reset (JWT + proxy guards) | ✅ done |
| 3 | Shared layouts & UI components for the three portals | ✅ done |
| 4 | Super Admin: users, courses, batches, enrollments, timetable | ✅ done |
| 5 | Tutor portal: attendance, assignments, materials | ✅ done |
| 6 | Test & quiz engine (builder + attempts + grading) | ✅ done |
| 7 | Student portal: pages, charts, PDF progress report | ✅ done |
| 8 | Announcements & messaging | ✅ done |
| 9 | Public website, registration/trial flows, CMS | ✅ done |
| 10 | Audit logs, settings, impersonation, analytics | ⏳ next |
| 11 | Security hardening, tests, performance, README final | ⏳ |

## Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript strict
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives)
- **Neon Postgres** via connection string — `@neondatabase/serverless`
  - `db` = `drizzle-orm/neon-http` (fast queries, no transactions)
  - `dbTx` = `drizzle-orm/neon-serverless` Pool over WebSocket (transactions)
- **Drizzle ORM** + `drizzle-kit` migrations
- **Custom JWT auth** (jose + bcryptjs, httpOnly cookies) — Phase 2
- Zod, React Hook Form, Recharts, nodemailer (Brevo SMTP, optional), Vercel Blob

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
copy .env.example .env.local    # Windows
cp .env.example .env.local      # macOS/Linux
# then fill in DATABASE_URL and JWT_SECRET (see below)

# 3. Apply migrations
npm run db:migrate

# 4. Seed demo data (admin, tutors, 25 students, courses, tests, CMS content)
npm run db:seed

# 5. Run the dev server
npm run dev
```

No Neon account yet, but want to sanity-check the database layer?

```bash
npm run db:verify-local   # runs migrations + seed against in-memory PGlite
```

## Connect your Neon database

1. Create a free project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, open your project → **Connection Details**.
3. Copy the **pooled** connection string (it ends with `?sslmode=require`) → this is `DATABASE_URL`.
4. Optionally copy the **direct** string → `DATABASE_URL_UNPOOLED` (used by drizzle-kit for migrations).
5. Locally: paste both into `.env.local`.
6. On Vercel: **Project Settings → Environment Variables** → add `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `JWT_SECRET` for Production (and Preview if you like).
7. Run migrations and seed from your machine (or a CI job) — they are not run automatically on deploy:

```bash
npm run db:migrate
npm run db:seed
```

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Environment variables

See [`.env.example`](./.env.example) — every variable is documented there.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon **pooled** string, `?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | optional | Neon **direct** string (migrations/push/studio) |
| `JWT_SECRET` | ✅ (Phase 2) | Long random string for signing session JWTs |
| `NEXT_PUBLIC_APP_URL` | ✅ | e.g. `https://emeraldheightacademy.com` (links in emails) |
| `SMTP_*`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | optional | Brevo SMTP; app runs fine without them |
| `BLOB_READ_WRITE_TOKEN` | optional | Vercel Blob uploads (tutor/admin file uploads) |

### Database npm scripts

| Script | What it does |
| --- | --- |
| `npm run db:generate` | Generate SQL migrations from schema changes (no DB needed) |
| `npm run db:migrate` | Apply unapplied migrations to Neon |
| `npm run db:push` | Push schema straight to Neon (dev-only alternative) |
| `npm run db:seed` | Seed demo data (idempotent; `FORCE_SEED=1` wipes + reseeds) |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run db:verify-local` | Offline check: migrations + seed against in-memory PGlite |

## Seed login credentials

All seeded accounts use the passwords below (change them in production).

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@emeraldheightacademy.com` | `Admin@1234` |
| Tutor (JAMB Maths) | `tutor.adebayo@emeraldheightacademy.com` | `Tutor@1234` |
| Tutor (WAEC English) | `tutor.chidinma@emeraldheightacademy.com` | `Tutor@1234` |
| Tutor (Primary) | `tutor.yusuf@emeraldheightacademy.com` | `Tutor@1234` |
| Tutor (Coding) | `tutor.grace@emeraldheightacademy.com` | `Tutor@1234` |
| Student (any of 25) | `aisha.bello@emeraldheightacademy.com`, `tunde.adeleke@emeraldheightacademy.com`, … | `Student@1234` |

The seed creates: 5 courses, 6 batches, 31 enrollments, ~470 attendance rows, assignments with submissions, a 42-question bank, 3 published tests with attempts (plus a draft), announcements, messages, registration/trial/contact requests and full CMS content (news, events, gallery, testimonials, FAQs, fees info).

## Project structure

```
/app            (public) marketing, (auth), /student, /tutor, /admin, /api/auth/*
/components     ui (shadcn), layout, charts, tables, forms, quiz, auth
/db             schema/, migrations/, seed/, index.ts (db + dbTx)
/lib            auth (jwt, session, passwords), rbac, api, rate-limit, email, validators
/hooks          shared React hooks
/proxy.ts       auth + role guard (Next 16 replaces middleware.ts with proxy.ts)
```

## Authentication & security

- **Custom JWT auth** (no NextAuth): non-expiring access token + rotating refresh token (14 days), both httpOnly / SameSite=Lax / Secure-in-prod cookies. Token expiry is by revocation (`users.token_version`), not by age; stale access cookies are re-issued silently inside `proxy.ts`.
- **Revocation**: every user has a `tokenVersion` (`tv` claim in the JWT). Changing or resetting a password bumps it, instantly invalidating all outstanding sessions.
- **Route guards** run in `proxy.ts` (Next 16's middleware): unauthenticated users bounce to `/login`; wrong-role users get redirected to their own portal home. Super Admins may visit all portals.
- **Login hardening**: 5 attempts / 15 min per email (then 429), identical generic error for unknown email vs wrong password, honeypot field, `Origin` checked on all auth POSTs.
- **Passwords**: bcrypt cost 12; strength rule = 8+ chars with upper, lower and a number. Seeded admin must change `Admin@1234` on first login (`mustChangePassword`); `/change-password` stays available even while that flag is set.
- **Audit trail**: failed/successful logins, password resets, role changes etc. are written to `audit_logs` (fire-and-forget, never blocks a request).
- **Next 16 note**: cookie-reading pages export `instant = false` so they render dynamically at request time (Cache Components build rule), and auth pages live in `app/(auth)/` with forms as client components.

## Local build without a real database

`.env.local` ships with dummy values so `next build` can evaluate route modules (build imports, but never connects). Replace them with your Neon values before running `db:migrate`, `db:seed` or using the app against real data.

## Deploying to Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. Add the environment variables from `.env.example` (Project Settings → Environment Variables).
3. Deploy. Run `npm run db:migrate && npm run db:seed` once against the production `DATABASE_URL`.
4. **Custom domain:** Project → Settings → Domains → add your domain, then at your registrar create:
   - `A` record `@` → `76.76.21.21`
   - `CNAME` `www` → `cname.vercel-dns.com`
   - Wait for DNS propagation (HTTPS is issued automatically).

## Set up Brevo SMTP (optional)

1. Create a free account at [brevo.com](https://brevo.com).
2. **Settings → SMTP & API → SMTP tab**: copy the SMTP server (`smtp-relay.brevo.com`), port `587`, your SMTP login and generate an **SMTP key** (not your account password).
3. **Senders & Domains:** verify the sender email/domain you will use in `EMAIL_FROM`.
4. Paste the values into `.env.local` / Vercel env vars.
5. Free plan limit: **300 emails/day**. The app works fully without SMTP — in dev, emails are printed to the server console.

## License

Private — all rights reserved by the centre owner.
