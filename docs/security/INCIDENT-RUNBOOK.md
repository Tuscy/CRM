# Security incident runbook (lightweight)

## Detection

- **Vercel**: build/runtime errors, traffic spikes, 5xx bursts.
- **Cloudflare**: Security Events, WAF blocks, rate-limit hits, bot scores.
- **Postgres provider**: connection/auth failures, storage alerts.
- **Application JSON logs** (`logStky(…)`): watch for `api_unauthorized`, `api_forbidden`, `portal_magic_link_send_failed`, `integration_key_*`.

## Immediate actions (credential suspected leaked)

1. **Rotate** `AUTH_SECRET` in Vercel (forces re-login for staff JWTs).
2. **Revoke** affected **Integration API keys** in Dashboard → **API keys** (or `CRM_API_KEY` env if still used).
3. **Rotate** webhook and OAuth secrets: `CRM_WEBHOOK_SECRET`, `GOOGLE_CLIENT_SECRET`, `N8N_API_KEY`, **`RESEND_API_KEY`** if email abuse suspected.
4. **Redeploy** the app after env changes.

## Database / data

1. Identify affected rows (e.g. leads touched in the window).
2. Restore from **automated backup** if needed (define RPO/RTO with your provider).
3. Enable **SSL** for `DATABASE_URL` in production; restrict network access to DB.

## Logging & follow-up

1. Export relevant **Vercel** logs and **Cloudflare** event samples for the incident window.
2. Document timeline, scope, and remediation.
3. Add a follow-up issue: rule tuning, missing alerts, or code fixes.

## Routine maintenance

- `pnpm audit` (CI or monthly).
- Review **dashboard** user list and **API keys** quarterly; revoke unused keys.
- Confirm **Upstash** and **Resend** usage/billing and key scopes.
