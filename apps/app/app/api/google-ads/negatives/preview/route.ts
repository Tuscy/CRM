import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { normalizeCustomerId } from "@/lib/google-ads/format";
import { callPythonBridge } from "@/lib/google-ads/python-bridge";
import type { NegativeKeywordInput } from "@/lib/google-ads/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (
    !(await requireAutomationAuth(
      request,
      "POST /api/google-ads/negatives/preview",
      ApiScope.GOOGLE_ADS_READ
    ))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { customerId: string; keywords: NegativeKeywordInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const customerId = normalizeCustomerId(body.customerId ?? "");
  if (customerId.length < 10) {
    return NextResponse.json(
      { error: "customerId is required (10-digit Ads account ID)" },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.keywords) || body.keywords.length === 0) {
    return NextResponse.json(
      { error: "keywords array is required and must not be empty" },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_ADS_SCRIPTS_ROOT) {
    return NextResponse.json(
      {
        error: "Python bridge not configured",
        message:
          "Set GOOGLE_ADS_SCRIPTS_ROOT in .env to enable negative keyword operations.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await callPythonBridge("lib.services.negatives", {
      customerId,
      keywords: body.keywords,
      execute: false,
      scriptName: "crm.negatives.preview",
      actor: "crm",
    });
    return NextResponse.json({ preview: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Python bridge failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
