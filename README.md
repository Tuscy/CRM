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
  - `lib/utils.ts` – `cn()` for Tailwind
  - `lib/constants.ts` – Pipeline stages
  - `lib/server/actions/` – Server actions (leads, deals)
- `prisma/` – Schema and migrations

## Features

- **Leads**: CRUD via API (`/api/leads`, `/api/leads/:id`) and server actions; list and detail UI
- **Pipeline**: Kanban by stage (New Lead → Won/Lost); move deals via card menu
- **Dashboard**: Counts and recent leads
- **Analytics**: Lead count, deal count, won deals, pipeline value

## Scripts

- `npm run dev` – Dev server
- `npm run build` – Production build (set `DATABASE_URL` for dashboard pages)
- `npm run db:generate` – Generate Prisma client
- `npm run db:migrate` – Run migrations
- `npm run db:push` – Push schema (no migration files)
- `npm run db:studio` – Open Prisma Studio
