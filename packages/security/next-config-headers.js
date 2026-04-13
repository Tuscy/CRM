/**
 * Shared security headers for Next.js `headers()` config.
 * @returns {{ source: string; headers: { key: string; value: string }[] }[]}
 */
function securityHeaderRoutes() {
  const isProd = process.env.NODE_ENV === "production";
  const cspReportOnly = process.env.CSP_REPORT_ONLY === "true";

  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    /** Next.js requires unsafe-inline for styles; eval needed for some dev tooling */
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src 'self' https: wss:",
  ];

  const csp = cspDirectives.join("; ");

  const out = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
  ];

  if (isProd) {
    out.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  if (cspReportOnly) {
    out.push({ key: "Content-Security-Policy-Report-Only", value: csp });
  } else {
    out.push({ key: "Content-Security-Policy", value: csp });
  }

  return [{ source: "/:path*", headers: out }];
}


module.exports = {
  securityHeaderRoutes,
};
