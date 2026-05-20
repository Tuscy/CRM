import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Phase 4 stub — writes go through Python sandbox (google-ads/scripts/python).
 * See CRM/docs/google-ads.md and google-ads/docs/CRM-INTEGRATION.md.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAutomationAuth(request, "POST /api/google-ads/preview"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    {
      error: "Not implemented",
      message:
        "Google Ads write preview is planned for phase 4 (Python bridge). Use google-ads/scripts/python/write/* locally until then.",
    },
    { status: 501 }
  );
}
