import { resolveCredential } from "@/lib/analytics/credentials";

export type ResolvedGBPCredential = {
  refreshToken: string; // decrypted
  /** Full location resource name: accounts/{accountId}/locations/{locationId} */
  locationName: string;
  isOrgLevel: boolean;
};

/**
 * Resolves a GBP credential for the given client. Same dual-credential lookup
 * as GA4/GSC: client-specific row first, then org-level (clientId = null).
 * For GBP, AnalyticsCredential.accountId stores the full location resource name.
 */
export async function resolveGBPCredential(
  clientId: string | null
): Promise<ResolvedGBPCredential | null> {
  const cred = await resolveCredential(clientId, "GBP");
  if (!cred) return null;
  return {
    refreshToken: cred.refreshToken,
    locationName: cred.accountId,
    isOrgLevel: cred.isOrgLevel,
  };
}
