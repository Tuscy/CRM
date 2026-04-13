/**
 * Scopes for IntegrationApiKey.scopes. Use "*" for full access.
 */
export const ApiScope = {
  LEADS_READ: "leads:read",
  LEADS_WRITE: "leads:write",
  DEALS_WRITE: "deals:write",
  ANALYTICS_READ: "analytics:read",
} as const;

export type ApiScopeName = (typeof ApiScope)[keyof typeof ApiScope];

export function scopeAllows(scopes: string[], required: string): boolean {
  if (scopes.includes("*")) return true;
  if (scopes.length === 0) return true;
  return scopes.includes(required);
}
