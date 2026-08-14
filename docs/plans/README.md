# Plans index

Status snapshot as of **2026-08-07** (verified directly against the live
codebase, not assumed from memory).

| Plan | Status | Notes |
|---|---|---|
| [`done/mobile-nav-drawer.md`](done/mobile-nav-drawer.md) | ✅ Implemented | `mobile-dashboard-shell.tsx` confirmed in the codebase. |
| [`done/personal-tasks-and-contacts.md`](done/personal-tasks-and-contacts.md) | ✅ Implemented | Both Part A (tasks) and Part B (contacts) confirmed. |
| [`xero-and-crm-updates.md`](xero-and-crm-updates.md) | ⬜ Not started | No Xero models, no `Lead.email` change, no `Client.status` yet. |
| [`xero-recurring-billing-n8n.md`](xero-recurring-billing-n8n.md) | ⬜ Not started (blocked) | Depends on `xero-and-crm-updates.md` Part A being done first — do not start this before that. |

## How this stays current

- **When a plan is finished**, move its file into `done/` and add a one-line
  status note at the top (what was verified, and the date). Don't just leave
  it in the root — a finished plan sitting next to active ones is exactly
  what causes confusion later (a future session, or Claude Code, treating
  done work as still pending).
- **Before handing any plan to Claude Code**, or before writing a new one
  that touches the same files, do a quick grep/read pass against the actual
  codebase rather than trusting the plan doc's "current state" section —
  plans are a snapshot from when they were written, not live state. This is
  exactly how the drift got caught this time: two of the four plans here had
  already been fully implemented outside this conversation without the docs
  being updated to reflect it.
- **When a plan depends on another** (like the n8n recurring-billing plan
  depending on the Xero connection plan), that dependency is noted in this
  table — check it before starting the dependent one.
- Ask for a "plan freshness audit" like this one any time you're not sure
  what's actually been built vs. what's still just a doc — cheap to check,
  expensive to accidentally redo or half-conflict with already-shipped work.
