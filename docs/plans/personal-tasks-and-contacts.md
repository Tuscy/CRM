# Plan: Personal task list + Contacts

Two additions for this implementation phase, alongside `mobile-nav-drawer.md`.
Both follow the conventions already in the codebase (Card/Button from `@stky/ui`,
table-based list pages like `apps/app/app/dashboard/clients/page.tsx`, server
actions in `lib/server/actions/*.ts`, `auth()` for the signed-in user via
`apps/app/auth.ts`, JWT session with `session.user.id`).

---

## Part A — Personal task list

### Problem

Task creation already exists (`createTask` in `lib/server/actions/tasks.ts`,
used via `components/crm/create-task-form.tsx`) but every task must belong to
a lead (`Task.leadId` is required in `packages/db/prisma/schema.prisma`). The
top-level `/dashboard/tasks` page (already in the nav, under "Funnel") is a
stub: "Task management per lead — coming soon." There is no delete action
anywhere in the codebase for tasks.

### Decisions made

- Tasks become **standalone-capable**: `Task.leadId` becomes optional so a
  task can exist with no lead attached, for a genuine personal to-do list.
- `assigneeId` doubles as the task's owner — a standalone task defaults its
  `assigneeId` to the signed-in user; no new "createdBy" field needed.
- `/dashboard/tasks` shows **all** tasks relevant to the signed-in user:
  standalone ones and lead-linked ones they're assigned to, in one flat list.
  Lead-linked rows show a small tag/link back to the lead; standalone rows
  don't.

### Schema change (`packages/db/prisma/schema.prisma`)

```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  dueDate     DateTime?
  completed   Boolean   @default(false)
  leadId      String?                      // was required, now optional
  assigneeId  String?
  lead        Lead?     @relation(fields: [leadId], references: [id], onDelete: Cascade) // now optional
  assignee    User?     @relation("TaskAssignee", fields: [assigneeId], references: [id])

  @@index([assigneeId])
}
```

Run the migration via whichever script the repo already uses for
`packages/db` (check `package.json` in that package — likely a
`prisma migrate dev` wrapper) and confirm it applies cleanly against the dev
database before touching any app code.

### Server actions (`apps/app/lib/server/actions/tasks.ts`)

- **`createTask`**: relax the signature so `leadId` is optional —
  `createTask(title, opts?: { leadId?: string; dueDate?: Date; assigneeId?: string })`.
  Existing call site in `create-task-form.tsx` still passes `leadId`
  positionally today, so update that call to match the new signature (or keep
  `leadId` as the first optional arg to minimize the diff — either is fine,
  just keep the existing per-lead form working unchanged from the user's
  point of view).
- **`deleteTask(taskId: string)`** — new. `prisma.task.delete`, then
  `revalidatePath` both `/dashboard/tasks` and, if the deleted task had a
  `leadId`, `/dashboard/leads/${leadId}` too.
- **`getMyTasks()`** — new. Fetches tasks where `assigneeId === session.user.id`,
  ordered by `completed` then `dueDate`, including the related `lead`'s `id`
  and `name` (if any) for the tag/link in the list.

### UI

- Rewrite `apps/app/app/dashboard/tasks/page.tsx` as a server component: call
  `auth()` and `getMyTasks()`, pass the list into a new client component
  `components/dashboard/personal-task-list.tsx`.
- `personal-task-list.tsx`: a quick-add input at the top (title + optional
  due date, submits via `createTask` with no `leadId`), then a flat list of
  rows below — checkbox (reuses `toggleTaskCompleted`), title, due date if
  set, a small "→ lead name" tag when `leadId` is present (links to
  `/dashboard/leads/${leadId}`), and a delete button (confirm before calling
  `deleteTask`).
- Add a matching delete button next to each task wherever `create-task-form.tsx`'s
  parent currently lists a lead's tasks (likely the lead detail page) — this
  falls out for free once `deleteTask` exists, and today there's no way to
  remove a task from anywhere.

### Non-goals

- No due-date reminders/notifications.
- No recurring tasks.
- No reassigning to other staff from this view (assignee stays whatever it
  was set to at creation).
- No drag-to-reorder.

### Verification

- Migration applies cleanly; existing per-lead tasks (pre-migration data)
  keep their `leadId` and still display correctly on the lead detail page.
- Add a standalone task (no lead) from `/dashboard/tasks`, refresh the page,
  confirm it's still there (real DB write, not local state).
- Toggle complete, confirm it persists.
- Delete a standalone task and a lead-linked task, confirm both are actually
  gone from the DB (not just hidden client-side) and, for the lead-linked
  one, gone from the lead detail page too.
- Confirm existing per-lead task creation (`create-task-form.tsx`) still
  works unchanged.

---

## Part B — Contacts

### Problem

There's no general-purpose address book. `Lead` (`email`, `phone`, `company`)
and `Client` (`primaryContactEmail`, `contactPhone`, `contactAddress`,
`companyName`) already store contact-ish info but in incompatible shapes, and
neither has a "where I know them from" or birthday concept. Rather than
merging those two live models into a shared shape (risky migration, both are
in active use elsewhere), add a new standalone `Contact` model for people who
aren't a lead or client, and give `/dashboard/contacts` a combined view.

### Decisions made

- New `Contact` model is fully standalone — no relation to `Lead`/`Client`,
  no dedupe/auto-linking logic.
- Only `name` is required; everything else is optional.
- "Where I know them from" is a free-text field (`knownFrom`), not an enum —
  the form offers quick-pick chips (BNI / Personal / Business / Referral) for
  speed, but any text is accepted and no migration is needed to add new
  categories later.
- Nav entry goes under **Tools** (next to Automations, Settings) in
  `apps/app/components/dashboard/dashboard-nav.tsx`.

### Schema addition (`packages/db/prisma/schema.prisma`)

```prisma
model Contact {
  id        String    @id @default(cuid())
  name      String
  email     String?
  phone     String?
  address   String?
  company   String?
  knownFrom String?
  birthday  DateTime? @db.Date
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

(`@db.Date` keeps it a date with no time component; confirm the provider in
`schema.prisma`'s `datasource` block supports it — Postgres does.)

### Server actions (new file `apps/app/lib/server/actions/contacts.ts`)

- `createContact(data)` — all fields except `name` optional.
- `updateContact(id, data)` — contact details realistically change over time
  (new phone, new address), so edit is included alongside add/delete rather
  than add-only.
- `deleteContact(id)` — `prisma.contact.delete`, `revalidatePath("/dashboard/contacts")`.
- `getAllContactRows()` — combines three sources into one shape
  (`{ id, kind: "contact" | "lead" | "client", name, email, phone, company, knownFrom?, birthday?, href }`):
  - all `Contact` rows (`kind: "contact"`, editable/deletable, no `href`),
  - all `Lead` rows mapped in (`kind: "lead"`, `href: /dashboard/leads/${id}`),
  - all `Client` rows mapped in (`kind: "client"`, `href: /dashboard/clients/${id}`).
  Sort combined list by name.

### UI

- Add "Contacts" to `NAV_ITEMS` in `dashboard-nav.tsx` under the existing
  `{ type: "heading", label: "Tools" }` block, before or after Automations.
- New page `apps/app/app/dashboard/contacts/page.tsx` — server component,
  calls `getAllContactRows()`, renders an "Add contact" button/form plus a
  table (following the `clients/page.tsx` table pattern): Name, Company,
  Email/Phone, Known from, Birthday, Type badge (Contact / Lead / Client),
  Actions column — Edit/Delete only shown for `kind: "contact"` rows; Lead/Client
  rows show a "View →" link to their existing detail page instead.
- Add/edit contact form: simple modal or inline card (matching
  `create-task-form.tsx`'s open/closed toggle pattern) with Name (required),
  Email, Phone, Address, Company, Known-from (text input + quick-pick chips
  for BNI/Personal/Business/Referral), Birthday (date input).
- Basic client-side search/filter by name across the combined list (no need
  for server-side search given expected volume).

### Non-goals

- No CSV import/export.
- No birthday reminders/notifications.
- No merging a standalone `Contact` into a real `Lead`/`Client` later
  (e.g. "convert to lead") — out of scope for this pass.
- No changes to the `Lead` or `Client` schemas or their existing forms.

### Verification

- Migration applies cleanly (new table, no changes to existing tables besides
  Part A's `Task.leadId` change).
- Add a contact with only a name, confirm it saves and displays with blanks
  for everything else.
- Add a contact with all fields filled, confirm birthday/knownFrom display
  correctly.
- Edit a contact, confirm changes persist.
- Delete a contact, confirm it's gone from the DB and the combined list.
- Confirm existing Leads and Clients all appear in the combined list as
  read-only rows linking to their real detail pages, and that nothing about
  the actual Lead/Client records changed.
- Confirm "Contacts" appears under Tools in the sidebar/drawer nav — including
  in the mobile drawer from `mobile-nav-drawer.md`, since both plans touch
  `dashboard-nav.tsx`'s consumer but not the nav item list itself, so this
  should just work once both are implemented.
