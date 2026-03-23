# Stky platform (monorepo)

Turborepo + pnpm workspaces: **public site renderer** (`apps/web`), **CRM + builder** (`apps/app`), shared **Prisma** (`packages/db`), UI, sites contracts, and section builder.

## Prerequisites

- Node 18+
- pnpm 9 (`npx pnpm@9.15.0 …` or [corepack](https://nodejs.org/api/corepack.html))

## Setup

```bash
cp .env.example .env
# Set DATABASE_URL and optional vars (see .env.example)

npx pnpm@9.15.0 install
npx pnpm@9.15.0 --filter @stky/db exec prisma migrate deploy
# or for local dev: npx pnpm@9.15.0 db:migrate
```

## Develop

```bash
# CRM on :3000, public web on :3001
npx pnpm@9.15.0 dev
```

Or per app:

```bash
npx pnpm@9.15.0 --filter @stky/app dev
npx pnpm@9.15.0 --filter @stky/web dev
```

## Packages

| Package        | Role                                      |
| -------------- | ----------------------------------------- |
| `@stky/db`     | Prisma schema, migrations, `prisma` export |
| `@stky/ui`     | Shared shadcn-style primitives            |
| `@stky/sites`  | Zod + section payload types               |
| `@stky/builder`| `SectionRenderer`, Hero / Cta / Text      |
| `@stky/crm`    | Shared CRM constants                      |
| `@stky/auth`   | Portal session (`membershipId` cookie)    |

## Notes

- **Workspace root**: Run all commands from this folder (`CRM/`). Open **`CRM/`** in your editor (not the parent `StkySites/` folder) so paths resolve correctly.
- **Staff gate**: set `STAFF_DASHBOARD_PASSWORD` to require `/dashboard/staff-login` before CRM routes (`apps/app` only).
- **Public sites**: map `customDomain` / `subdomain` + `ROOT_DOMAIN`, or use `?siteId=` / `DEV_SITE_ID` on localhost (`apps/web`).
- **Pre-monorepo Next app** (old `app/`, `prisma/`, etc.) is archived under `_legacy-pre-monorepo/` for reference only. **Source of truth**: `apps/app` + `packages/db`.
