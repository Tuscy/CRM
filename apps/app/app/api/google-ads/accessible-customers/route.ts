import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { listAccessibleCustomers, parseGoogleAdsError } from "@/lib/google-ads/client";
import { getGoogleAdsEnvStatus } from "@/lib/google-ads/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (
    !(await requireAutomationAuth(
      request,
      "GET /api/google-ads/accessible-customers",
      ApiScope.GOOGLE_ADS_READ
    ))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = getGoogleAdsEnvStatus();
  if (!env.ready) {
    return NextResponse.json(
      {
        error: "Google Ads credentials not configured on server",
        env,
      },
      { status: 503 }
    );
  }

  try {
    const customers = await listAccessibleCustomers();
    return NextResponse.json({ customers, env });
  } catch (err) {
    return NextResponse.json(
      { error: parseGoogleAdsError(err) },
      { status: 502 }
    );
  }
}
