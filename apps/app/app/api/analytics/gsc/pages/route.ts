/**
 * GET /api/analytics/gsc/pages?clientId=&range=
 *
 * Returns top 10 Search Console pages with clicks, impressions, CTR.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { resolveCredential } from "@/lib/analytics/credentials";
import { fetchGscPages } from "@/lib/analytics/gsc-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireAutomationAuth(request, "GET /api/analytics/gsc/pages", ApiScope.ANALYTICS_READ))) {
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
    const pages = await fetchGscPages(cred.accountId, cred.refreshToken, range);
    return NextResponse.json({ pages, isOrgLevel: cred.isOrgLevel });
  } catch (err) {
    console.error("GSC pages error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search Console API error" },
      { status: 502 }
    );
  }
}
