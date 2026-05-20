# Google Ads in the CRM

Staff dashboard for Google Ads performance (read-only in v1). Writes use the `google-ads/` Python sandbox until phase 4.

## Environment variables

Add to `CRM/.env` (copy values from `google-ads/config/google-ads.yaml`):

```bash
GOOGLE_ADS_DEVELOPER_TOKEN=""
GOOGLE_ADS_CLIENT_ID=""
GOOGLE_ADS_CLIENT_SECRET=""
GOOGLE_ADS_REFRESH_TOKEN=""
```

Optional (phase 4 writes bridge):

```bash
GOOGLE_ADS_PYTHON_BIN="python3"
GOOGLE_ADS_SCRIPTS_ROOT="/absolute/path/to/Software/google-ads/scripts/python"
```

## Database

```bash
cd CRM
pnpm db:migrate
```

Models: `GoogleAdsSettings` (MCC `loginCustomerId`), `GoogleAdsConnection` (CRM client ↔ Ads customer ID), `GoogleAdsAuditLog` (phase 4).

## UI

| Route | Purpose |
|-------|---------|
| `/dashboard/google-ads` | Overview: account picker, metrics, campaigns, keywords |
| `/dashboard/google-ads/settings` | MCC ID, account mappings, test connection |

## API (staff session or integration key with `google-ads:read`)

- `GET /api/google-ads/settings`
- `PUT /api/google-ads/settings`
- `GET /api/google-ads/connections`
- `POST /api/google-ads/connections`
- `DELETE /api/google-ads/connections?id=`
- `GET /api/google-ads/accessible-customers`
- `GET /api/google-ads/dashboard?customerId=&days=30&refresh=1`

## Agency workflow

- One MCC in settings; many Ads accounts under it.
- Optional link from a CRM **Client** to an Ads customer ID (multiple Ads accounts per client allowed).
- Overview always allows picking any accessible Ads account or typing a customer ID.

## Writes (phase 4)

Use `google-ads/scripts/python/write/*` locally or wire `POST /api/google-ads/preview` (501 stub) to a Python subprocess. See `google-ads/docs/CRM-INTEGRATION.md`.
