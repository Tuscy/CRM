import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { getGoogleAdsEnvStatus } from "@/lib/google-ads/env";
import { normalizeCustomerId } from "@/lib/google-ads/format";
import { getDashboard } from "@/lib/google-ads/dashboard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (
    !(await requireAutomationAuth(
      request,
      "GET /api/google-ads/dashboard",
      ApiScope.GOOGLE_ADS_READ
    ))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const customerId = normalizeCustomerId(searchParams.get("customerId") ?? "");
  const days = Math.min(
    90,
    Math.max(7, parseInt(searchParams.get("days") ?? "30", 10) || 30)
  );
  const skipCache = searchParams.get("refresh") === "1";

  if (customerId.length < 10) {
    return NextResponse.json(
      { error: "customerId query param required (10-digit Ads account ID)" },
      { status: 400 }
    );
  }

  const env = getGoogleAdsEnvStatus();
  if (!env.ready) {
    return NextResponse.json(
      { error: "Google Ads credentials not configured on server", env },
      { status: 503 }
    );
  }

  try {
    const data = await getDashboard({
      adsCustomerId: customerId,
      days,
      skipCache,
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dashboard fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
