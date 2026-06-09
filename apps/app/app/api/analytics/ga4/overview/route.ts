/**
 * GET /api/analytics/ga4/overview?clientId=&range=
 *
 * Returns GA4 summary metrics for a client (or the org-level property).
 * range: "7d" | "28d" | "90d" (default "28d")
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { resolveCredential } from "@/lib/analytics/credentials";
import { fetchGa4Overview } from "@/lib/analytics/ga4-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireAutomationAuth(request, "GET /api/analytics/ga4/overview", ApiScope.ANALYTICS_READ))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || null;
  const range = searchParams.get("range") ?? "28d";

  const cred = await resolveCredential(clientId, "GA4");
  if (!cred) {
    return NextResponse.json(
      { error: "GA4 credentials not configured", notConfigured: true },
      { status: 404 }
    );
  }

  try {
    const data = await fetchGa4Overview(cred.accountId, cred.refreshToken, range);
    return NextResponse.json({ ...data, isOrgLevel: cred.isOrgLevel });
  } catch (err) {
    console.error("GA4 overview error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GA4 API error" },
      { status: 502 }
    );
  }
}
