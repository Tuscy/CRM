/**
 * GET /api/gbp/reviews?clientId=&pageToken=
 *
 * Lists Google Business Profile reviews for a client (or the org-level
 * location), paginated 50 per page.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { resolveGBPCredential } from "@/lib/gbp/resolver";
import { listReviews } from "@/lib/gbp/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireAutomationAuth(request, "GET /api/gbp/reviews", ApiScope.GBP_READ))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || null;
  const pageToken = searchParams.get("pageToken") || undefined;

  const cred = await resolveGBPCredential(clientId);
  if (!cred) {
    return NextResponse.json(
      { error: "GBP credentials not configured", notConfigured: true },
      { status: 404 }
    );
  }

  try {
    const data = await listReviews(cred.locationName, cred.refreshToken, pageToken);
    return NextResponse.json({ ...data, isOrgLevel: cred.isOrgLevel });
  } catch (err) {
    console.error("GBP reviews error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GBP API error" },
      { status: 502 }
    );
  }
}
