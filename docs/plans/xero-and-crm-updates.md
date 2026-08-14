# Plan: Xero integration, lead contact validation, client offboarding

Three parts for this implementation phase. Recurring/scheduled invoicing via
n8n is intentionally **not** in this plan — see the separate
`xero-recurring-billing-n8n.md` for that, to implement later.

Conventions to follow (all already established in this codebase): Card/Button
from `@stky/ui`, server actions in `lib/server/actions/*.ts`, live-fetch
pattern for external data (see `components/analytics/reporting-view.tsx` —
fetch on page load, no local duplication of external data), encrypted
credential storage already used for `AnalyticsCredential`, and the
settings-page + mapping-table pattern already used for Google Ads
(`google-ads-connections-form.tsx`).

---

## Part A — Xero integration (read-only + webhook)

### Problem

No accounting integration exists. Client billing/invoice status lives only
in Xero, invisible from the CRM. There's also a currently-unused `Invoice`
model in the schema — leave it alone; it's not part of this plan.

### Decisions made

- **Xero stays the source of truth for invoicing.** This plan does not add
  invoice creation/editing to the CRM. (A "compose in CRM, create in Xero"
  hybrid was discussed as a possible later option — not built here. If
  wanted later, it needs one additional write scope on top of what's set up
  in this plan.)
- **One Xero connection, not per-client** — this is StickySites' own Xero
  organisation, connected once. Each CRM `Client` is then individually
  mapped to a Xero contact.
- **Read-only scopes only**: `offline_access`, `accounting.contacts.read`,
  `accounting.invoices.read`, `accounting.transactions.read`. Built against
  Xero's post-March-2026 granular scope model — do not request the old
  broad scopes.
- **Live fetch, not sync** — invoice data is fetched from Xero on page load,
  same pattern as the GA4/GSC reporting sections. No local invoice table.
- **Webhook receiver for real-time updates** — when an invoice changes in
  Xero (e.g. marked paid), Xero pushes a webhook to the CRM. This updates
  the relevant client's activity feed and invalidates the cached page so
  the next view shows current status, without needing to poll.
- Build and test this entire part against Xero's free Demo Company — no
  paid Xero subscription needed for anything in this plan.

### Schema changes (`packages/db/prisma/schema.prisma`)

```prisma
model XeroCredential {
  id            String   @id @default(cuid())
  tenantId      String   @unique   // Xero's organisation identifier
  tenantName    String?
  refreshToken  String              // encrypted at rest, same approach as AnalyticsCredential
  connectedAt   DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Add to `Client`:

```prisma
model Client {
  // ...existing fields...
  xeroContactId String?   // set once mapped via Settings → Xero
}
```

`ActivityLog.actorId` is currently required (`String`, FK to `User`) — there's
no user behind an automated Xero webhook event. Recommended approach: seed a
single "System" `User` row (e.g. `system@stky.internal`, `isStaff: false` or
a dedicated flag) and attribute automated activity log entries to it. This
avoids a schema change (`actorId` staying required) and keeps the existing
`ActivityLog` model/UI as-is. Note during implementation: check whether
`ActivityLog` already has a rendering surface on the client detail page — if
not, that's a small addition needed for the webhook entries to actually be
visible anywhere.

### OAuth + webhook plumbing (`apps/app/lib/xero/`)

- `oauth.ts` — connect/callback flow mirroring the existing pattern in
  `apps/app/app/api/oauth/google/`. Handle Xero's 30-minute access token
  expiry by refreshing on every server-side call that needs one (not just at
  connect time) — same principle as `makeAuthClient` in `lib/analytics/ga4-api.ts`
  and `gsc-api.ts`, refresh token in, fresh client out.
- `client.ts` — thin Accounting API wrapper: `getContacts()` (for the
  mapping dropdown), `getInvoicesForContact(xeroContactId)`.
- `webhook.ts` — verifies Xero's webhook signature (HMAC-SHA256 using the
  webhook signing key from the Xero app's developer settings) before
  processing anything. Reject unsigned/invalid requests. Xero requires a
  fast 200 response, so acknowledge first and process the event payload
  (which invoice, which tenant, what changed) after.

### New routes

- `apps/app/app/api/oauth/xero/route.ts` + `.../callback/route.ts` — connect flow.
- `apps/app/app/api/webhooks/xero/route.ts` — POST receiver. Verifies
  signature, looks up the affected CRM client via `xeroContactId`, writes an
  `ActivityLog` entry (e.g. "Invoice #INV-0042 marked as Paid via Xero"),
  and calls `revalidatePath` on that client's detail page.

### Server actions (new `apps/app/lib/server/actions/xero.ts`)

- `getXeroConnectionStatus()` — connected/not, tenant name.
- `listXeroContacts()` — live from Xero, for the mapping UI.
- `setClientXeroContact(clientId, xeroContactId)`.
- `getInvoicesForClient(clientId)` — live fetch via the client's mapped
  `xeroContactId`; returns "not connected" state if unmapped, matching the
  `NotConfigured` pattern already in `reporting-view.tsx`.

### UI

- New page `apps/app/app/dashboard/settings/xero/page.tsx` — "Connect Xero"
  button, connection status (org name), and a client-to-contact mapping
  table styled like `GoogleAdsConnectionsForm`.
- Client detail page: new "Invoices (Xero)" card — number, status, due date,
  total, outstanding balance, link out to Xero's hosted invoice page. Same
  loading/error/not-configured states as `PaidSection`/`OrganicSection` in
  `reporting-view.tsx`.

### Non-goals

- No invoice creation/editing from the CRM.
- No n8n, no recurring/scheduled invoicing (separate plan).
- No multi-org Xero support.
- No automatic fuzzy-matching of clients to Xero contacts — manual mapping only.

### Verification

- Full OAuth connect flow against the free Xero Demo Company.
- Token refresh works correctly past the 30-minute expiry.
- Map a demo contact to a CRM client, confirm their invoices display.
- In the Demo Company, change an invoice's status (e.g. mark paid), confirm
  the webhook fires, an `ActivityLog` entry appears, and the client page
  reflects the new status on next load.
- Send a forged/unsigned request to the webhook route and confirm it's
  rejected — signature verification actually has to work, not just exist.

---

## Part B — Lead creation: require email OR phone, not both

### Problem

`apps/app/components/crm/create-lead-form.tsx` marks email as the only
required contact field (`required` on the email input); phone is optional.
`Lead.email` is a required (non-nullable) field in the schema. There's no
way today to create a lead with only a phone number.

### Decision

At least one of email or phone must be present — not both mandatory, and
not email-only.

### Schema change

```prisma
model Lead {
  // ...
  email String?   // was required, now optional
  phone String?   // unchanged
}
```

### Server action (`apps/app/lib/server/actions/leads.ts`)

- `createLead` and the update path: throw a validation error if both `email`
  and `phone` are empty/undefined after trimming. Keep everything else
  unchanged.

### Forms

- `create-lead-form.tsx` and `update-lead-form.tsx`: remove the hard
  `required` attribute from the email input (keep `type="email"` for format
  validation when a value is entered). Add a shared client-side check before
  submit — if both fields are empty, show an inline error ("Provide an email
  or phone number") instead of calling the server action.

### Downstream audit (do this, don't skip it)

`Lead.email` going nullable means anything that currently assumes it's a
string will need a null check:
- Anywhere `lead.email` is rendered in lists/detail views (leads table, lead
  detail page) — fall back to something like "—" when null.
- The email-flow system (`lib/email-flows/`) enrolls leads into flows that
  send emails. A phone-only lead has nothing to send to — flow enrollment
  needs to either skip the send step gracefully (log it, don't crash) or
  surface "no email on file" rather than attempting a send with an empty
  `to` address. Trace this at implementation time from `enrolMatchingFlows`
  / `enrolInFlow` through to wherever the actual send call happens.

### Non-goals

- No SMS/text-message flow steps to compensate for phone-only leads — that's
  new automation infrastructure, not part of this fix.
- `Client.primaryContactEmail` stays required — this change is leads-only.

### Verification

- Create a lead with phone only, no email — succeeds.
- Create a lead with email only, no phone — succeeds (existing behaviour,
  unchanged).
- Create a lead with neither — blocked both client-side (before submit) and
  server-side (defence in depth).
- Existing leads with an email display and behave exactly as before.
- Enrolling a phone-only lead into an email-based flow doesn't throw or
  silently fail — it degrades gracefully.

---

## Part C — Client offboarding (former client status)

### Problem

There's no way to mark a client as no longer a client. Trigger example: a
client StickySites built a website for has moved hosting elsewhere. Today
the `Client` model has no status concept at all — every client is implicitly
"active" forever, indefinitely, with no record of when or why a relationship
ended.

### Decision

Add a client-level status (Active / Former) with an end date and optional
reason. Full history — sites, invoices, activity log, past leads — stays
intact and viewable; former clients just stop showing up by default in
active-client views, reporting client pickers, and the Xero mapping list.

Note: this is a whole-relationship status, not a per-service one. The
existing (currently unused in the UI) `ClientService.active` flag already
covers "this one service ended but the client is still active for others" —
that's a smaller, separate follow-up, not part of this pass. Don't
conflate the two: this plan's status field answers "is this still a client
at all," not "which specific services are still running."

### Schema changes

```prisma
enum ClientStatus {
  ACTIVE
  FORMER
}

model Client {
  // ...existing fields...
  status      ClientStatus @default(ACTIVE)
  endedAt     DateTime?
  endedReason String?
}
```

### Server actions (`apps/app/lib/server/actions/clients.ts`)

- `markClientFormer(clientId, { reason?: string; endedAt?: Date })` — sets
  `status: FORMER`, `endedAt` (defaults to now), `endedReason`.
- `reactivateClient(clientId)` — sets `status: ACTIVE`, clears `endedAt`/`endedReason`
  (covers both mistakes and a client returning later).

### Audit every call site of `getClients()`

This function feeds the clients list, the reporting page's client picker,
and (per Part A) the Xero mapping dropdown. Decide per call site whether it
should default to active-only (most list/dropdown contexts) or still surface
former clients with a status badge (e.g. reporting, where you might still
want to pull a former client's historical numbers). Don't let this silently
break an existing dropdown by hiding clients that are still referenced
elsewhere (e.g. a former client with an active Xero mapping should probably
still be selectable there, just visibly labelled).

### UI

- Client detail page: status badge (Active / Former), showing ended date +
  reason when former. "Mark as former client" action (small confirm form —
  reason text, optional) and, when already former, a "Reactivate" action.
- Clients list page (`apps/app/app/dashboard/clients/page.tsx`): status
  column/badge, and a filter/toggle (Active / All / Former) — default view
  stays Active-only to match current behaviour.

### Non-goals

- No automated churn detection (e.g. no auto-flip based on inactivity).
- No per-service (`ClientService.active`) toggle UI in this pass — schema
  already supports it, it's a smaller follow-up whenever it's wanted.
- No cascading changes to actual hosting/DNS infrastructure — marking a
  client Former in the CRM is a record-keeping action, not an ops action.
- No automatic archiving of the client's Xero contact.

### Verification

- Mark a client Former with a reason, confirm the badge/end date/reason show
  on their detail page.
- Confirm they disappear from the default (Active) clients list but are
  still reachable via the "Former"/"All" filter.
- Confirm their historical leads, invoices (via Part A), sites, and activity
  log are all still intact and viewable — nothing gets deleted or hidden
  beyond the list views.
- Reactivate and confirm status/end-date/reason all clear correctly.
