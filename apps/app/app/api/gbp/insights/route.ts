/**
 * GET /api/gbp/insights?clientId=&range=
 *
 * Business Profile performance metrics from
 * businessprofileperformance.googleapis.com/v1.
 * range: 7 | 30 | 90 (days, default 30)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { resolveGBPCredential } from "@/lib/gbp/resolver";
import { getInsights } from "@/lib/gbp/client";

export const dynamic = "force-dynamic";

const VALID_RANGES = [7, 30, 90];

export async function GET(request: NextRequest) {
  if (!(await requireAutomationAuth(request, "GET /api/gbp/insights", ApiScope.GBP_READ))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") || null;
  const rangeRaw = Number(searchParams.get("range") ?? 30);
  const range = VALID_RANGES.includes(rangeRaw) ? rangeRaw : 30;

  const cred = await resolveGBPCredential(clientId);
  if (!cred) {
    return NextResponse.json(
      { error: "GBP credentials not configured", notConfigured: true },
      { status: 404 }
    );
  }

  try {
    const data = await getInsights(cred.locationName, cred.refreshToken, range);
    return NextResponse.json({ ...data, isOrgLevel: cred.isOrgLevel });
  } catch (err) {
    console.error("GBP insights error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GBP API error" },
      { status: 502 }
    );
  }
}
