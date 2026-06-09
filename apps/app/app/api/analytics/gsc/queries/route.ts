/**
 * GET /api/analytics/gsc/queries?clientId=&range=
 *
 * Returns top 10 Search Console queries: clicks, impressions, CTR, avg position.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { resolveCredential } from "@/lib/analytics/credentials";
import { fetchGscQueries } from "@/lib/analytics/gsc-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireAutomationAuth(request, "GET /api/analytics/gsc/queries", ApiScope.ANALYTICS_READ))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || null;
  const range = searchParams.get("range") ?? "28d";

  const cred = await resolveCredential(clientId, "SEARCH_CONSOLE");
  if (!cred) {
    return NextResponse.json(
      { error: "Search Console credentials not configured", notConfigured: true },
      { status: 404 }
    );
  }

  try {
    const queries = await fetchGscQueries(cred.accountId, cred.refreshToken, range);
    return NextResponse.json({ queries, isOrgLevel: cred.isOrgLevel });
  } catch (err) {
    console.error("GSC queries error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search Console API error" },
      { status: 502 }
    );
  }
}
