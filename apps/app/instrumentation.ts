export async function register() {
  if (process.env.NODE_ENV !== "production") return;

  if (!process.env.AUTH_SECRET) {
    // eslint-disable-next-line no-console
    console.error(
      "[stky] CRITICAL: AUTH_SECRET is unset in production. Set it in Vercel env (CRM README)."
    );
  }

  if (
    process.env.ALLOW_LEGACY_STAFF_PASSWORD === "true" &&
    process.env.STAFF_DASHBOARD_PASSWORD
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "[stky] Legacy STAFF_DASHBOARD_PASSWORD gate is allowed in production. Prefer AUTH_SECRET + staff users only."
    );
  }
}
