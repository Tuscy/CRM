import { prisma } from "@stky/db";
import { decrypt } from "@/lib/server/encrypt";

export type AnalyticsCredType = "GA4" | "SEARCH_CONSOLE";

export type ResolvedCredential = {
  id: string;
  accountId: string;
  refreshToken: string; // decrypted
  isOrgLevel: boolean;
};

/**
 * Resolves a credential for the given client + type.
 * Lookup order:
 *   1. Client-specific row (clientId + type)
 *   2. Org-level row (clientId = null + type)
 *   3. Returns null if neither exists.
 */
export async function resolveCredential(
  clientId: string | null,
  type: AnalyticsCredType
): Promise<ResolvedCredential | null> {
  // Try client-specific first
  if (clientId) {
    const row = await prisma.analyticsCredential.findFirst({
      where: { clientId, type },
    });
    if (row) {
      return {
        id: row.id,
        accountId: row.accountId,
        refreshToken: decrypt(row.refreshToken),
        isOrgLevel: false,
      };
    }
  }

  // Fall back to org-level credential (clientId = null)
  const orgRow = await prisma.analyticsCredential.findFirst({
    where: { clientId: null, type },
  });
  if (!orgRow) return null;

  return {
    id: orgRow.id,
    accountId: orgRow.accountId,
    refreshToken: decrypt(orgRow.refreshToken),
    isOrgLevel: true,
  };
}

/**
 * Normalises a GA4 accountId so it always has the `properties/` prefix.
 */
export function normaliseGa4PropertyId(accountId: string): string {
  if (accountId.startsWith("properties/")) return accountId;
  return `properties/${accountId}`;
}
