import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** @deprecated Use POST /api/google-ads/rsa/preview or /api/google-ads/negatives/preview */
export async function POST(request: NextRequest) {
  if (!(await requireAutomationAuth(request, "POST /api/google-ads/preview"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    {
      error: "Gone",
      message:
        "This endpoint is retired. Use POST /api/google-ads/rsa/preview or POST /api/google-ads/negatives/preview instead.",
      alternatives: [
        "/api/google-ads/rsa/preview",
        "/api/google-ads/negatives/preview",
      ],
    },
    { status: 410 }
  );
}
