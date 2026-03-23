# Web Agency CRM

Internal CRM for leads, deals, and pipeline management. Built with Next.js (App Router), Prisma, and shadcn/ui per the [architecture guide](docs).

## Setup

1. **Install dependencies** (already done if you ran `npm install`)

   ```bash
   npm install
   ```

2. **Database**

   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to your PostgreSQL connection string (e.g. [Neon](https://neon.tech))

   ```bash
   cp .env.example .env
   ```

3. **Run migrations**

   ```bash
   npm run db:migrate
   ```

   Or apply schema without migration history:

   ```bash
   npm run db:push
   ```

4. **Start dev server**

   ```bash
   npm run dev
   ```

- App: [http://localhost:3000](http://localhost:3000)
- Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## Environment variables

Create a `.env` file (based on `.env.example`) and configure:

- **`DATABASE_URL`** – PostgreSQL connection string (Neon recommended)
- **`GOOGLE_CLIENT_ID`** – OAuth 2.0 client ID for Google Analytics
- **`GOOGLE_CLIENT_SECRET`** – OAuth 2.0 client secret
- **`GOOGLE_OAUTH_REDIRECT_URL`** – Redirect URL configured in your Google Cloud OAuth client  
  e.g. `https://your-crm.vercel.app/api/auth/google/callback` (you can adjust the path when we wire the OAuth flow)

These GA variables are needed once you start connecting client sites to GA4.

## Project structure

- `app/` – Next.js App Router
  - `app/dashboard/` – CRM dashboard (leads, pipeline, tasks, analytics)
  - `app/api/` – API routes (leads, deals)
- `components/` – UI and CRM components
  - `components/ui/` – shadcn-style primitives (Button, Card, Dialog, Dropdown)
  - `components/crm/` – CreateLeadForm, UpdateLeadForm, PipelineKanban, DeleteLeadButton
- `lib/` – Shared code
  - `lib/prisma.ts` – Prisma client singleton
  - `lib/auth.ts` – Auth placeholder (Clerk/Auth.js)
  - `lib/auth-client.ts` – Client portal auth helper (cookie-based `ClientUser` session)
  - `lib/utils.ts` – `cn()` for Tailwind
  - `lib/constants.ts` – Pipeline stages
  - `lib/server/actions/` – Server actions (leads, deals, client auth)
- `prisma/` – Schema and migrations

## Features

- **Leads**: CRUD via API (`/api/leads`, `/api/leads/:id`) and server actions; list and detail UI
- **Pipeline**: Kanban by stage (New Lead → Won/Lost); move deals via card menu
- **Dashboard**: Counts and recent leads
- **Analytics**: Lead count, deal count, won deals, pipeline value
- **Client portal**: `/client` area where clients can log in to view their own leads and (soon) analytics

## Scripts

- `npm run dev` – Dev server
- `npm run build` – Production build (set `DATABASE_URL` for dashboard pages)
- `npm run db:generate` – Generate Prisma client
- `npm run db:migrate` – Run migrations
- `npm run db:push` – Push schema (no migration files)
- `npm run db:studio` – Open Prisma Studio
