# Cloudflare edge & WAF (Vercel origins)

Point your production hostnames at Cloudflare (orange cloud / proxied). Vercel remains the origin: DNS `CNAME` to `cname.vercel-dns.com` or use Vercel’s Cloudflare integration.

## TLS / HTTPS

1. **SSL/TLS** → Full (strict).
2. **Always Use HTTPS** → On.
3. **Automatic HTTPS Rewrites** → On.
4. After validating HTTPS everywhere, enable **HSTS** (short max-age first, then increase). The app also sets HSTS headers via Next.js.

## WAF

1. Enable **Managed Rules** (OWASP Core Ruleset).
2. Enable **Bot Fight Mode** or **Super Bot Fight** (balanced) for public sites.
3. Add custom rules as needed, for example:
   - **Challenge** or **Block** suspicious countries for `/dashboard/*` and `/api/*` if your team is region-locked.
   - **Rate limit** by IP on `/api/*` (e.g. 200 req/min) as a backup to Upstash in the app.
   - **Rate limit** auth paths: `/client/login`, `/dashboard/staff-login`, `/auth/*`.

## Rate limiting

Prefer **Rate limiting rules** (or **Advanced Rate Limiting**) on sensitive paths. Align with in-app limits when **`UPSTASH_REDIS_REST_URL`** / **`UPSTASH_REDIS_REST_TOKEN`** are set (see `.env.example`).

## Firewall for admin/API

- Optional **IP Access Rules** (or **Zero Trust** policies) allowing only office/VPN IPs to `/dashboard/*` if everyone is internal.
- Ensure monitoring alerts on **WAF events** spikes (Dashboard → Security → Events).

## Origin access

- Do not expose raw `*.vercel.app` URLs for production; redirect or restrict if possible.
- Keep Vercel deployment protection off for public sites; use app auth instead.

## Turnstile (optional)

For public forms or login pages, add **Turnstile** and verify server-side before sending magic-link email or creating leads.
