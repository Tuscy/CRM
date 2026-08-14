# Plan: Recurring invoice generation via n8n (later — not now)

**Do not implement this yet.** This is a reference for when the n8n workflow
work happens later. It depends on `xero-and-crm-updates.md` Part A (Xero
OAuth connection + client-to-contact mapping) already being built and
working — this plan only adds the piece n8n needs to call.

## Problem

`Client.billingPeriod`, `billingPrice`, and `billingCurrency` already exist
in the schema but are unused — nothing generates recurring invoices from
them. There's no cron/scheduler running inside the Next.js app itself, and
n8n is already running as infrastructure (see the Automations page,
`N8N_BASE_URL`/`N8N_API_KEY`), so the scheduling belongs there rather than
as a bespoke cron system in the CRM.

## Scope change from Part A

Part A only requests **read** scopes from Xero. Generating invoices needs a
write scope — `accounting.invoices` (create). This means the Xero app's
OAuth consent needs updating when this is implemented; existing connections
will need to be re-authorised to grant the additional scope.

## What the CRM needs to expose

- A new, protected API endpoint (e.g. `POST /api/xero/invoices/generate-recurring`).
  Protected by a shared secret (n8n calls this server-to-server, there's no
  logged-in user session), not staff auth.
- Endpoint logic: find all `Client` rows with `status: ACTIVE` (per
  `xero-and-crm-updates.md` Part C), a `billingPeriod` set, and due for
  invoicing this cycle. For each, create an invoice in Xero via the
  Accounting API against their mapped `xeroContactId`, using `billingPrice`/
  `billingCurrency` as the line item.
- **Idempotency**: track `lastInvoicedAt` on `Client` (new field) and check
  it before creating — the schedule running twice in a billing period must
  not double-invoice. Update `lastInvoicedAt` after a successful create.

## What n8n needs to do (build this part later, separately)

A scheduled (cron) workflow that calls the endpoint above on whatever cadence
makes sense (e.g. daily, letting the endpoint's own due-date logic decide who
actually gets invoiced that run). Retry/failure handling on missed calls is
n8n's job, not the CRM endpoint's.

## Non-goals

- No proration logic for clients who change billing mid-cycle.
- No invoice sending logic beyond what Xero already does natively once an
  invoice is created/approved there.
- No UI in the CRM for this — it's a background job, visibility comes from
  the existing Part A invoice display on the client detail page.

## Verification (when this gets built)

- Test against Xero's Demo Company first, same as Part A.
- Confirm the endpoint correctly skips clients without a `billingPeriod`,
  without a Xero mapping, or already invoiced this cycle.
- Confirm re-running the endpoint twice in the same period doesn't create
  duplicate invoices.
- Confirm the new write scope doesn't silently break the read-only flows
  from Part A (re-test invoice display and the webhook receiver after
  re-authorising with the expanded scope).
