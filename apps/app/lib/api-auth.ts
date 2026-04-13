import type { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@stky/db";
import { logStky } from "@/lib/observability";
import { hashApiKey } from "@stky/security";
import { scopeAllows, type ApiScopeName } from "@/lib/api-scopes";

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const xKey = request.headers.get("x-api-key");
  return bearer || xKey || null;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Allows automation (scoped integration key, legacy CRM_API_KEY) or staff session.
 */
export async function requireAutomationAuth(
  request: NextRequest,
  context: string,
  requiredScope?: ApiScopeName
): Promise<boolean> {
  const token = extractToken(request);
  const legacyEnvKey = process.env.CRM_API_KEY;

  if (token) {
    const keyHash = hashApiKey(token);
    const record = await prisma.integrationApiKey.findUnique({
      where: { keyHash },
    });

    if (record && !record.revokedAt) {
      if (
        requiredScope &&
        !scopeAllows(record.scopes, requiredScope)
      ) {
        logStky("api_forbidden", { context, reason: "scope", scope: requiredScope });
        return false;
      }
      void prisma.integrationApiKey
        .update({
          where: { id: record.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});
      return true;
    }

    if (legacyEnvKey && timingSafeEqualStr(token, legacyEnvKey)) {
      return true;
    }
  }

  const session = await auth();
  if (session?.user?.isStaff) {
    return true;
  }

  logStky("api_unauthorized", { context });
  return false;
}
