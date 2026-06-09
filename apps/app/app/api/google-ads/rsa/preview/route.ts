import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { normalizeCustomerId } from "@/lib/google-ads/format";
import { callPythonBridge } from "@/lib/google-ads/python-bridge";
import type { RsaAsset } from "@/lib/google-ads/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type RsaUpdateBody = {
  customerId: string;
  adId: string;
  adGroupId: string;
  campaignId: string;
  headlines: RsaAsset[];
  descriptions: RsaAsset[];
};

export async function POST(request: NextRequest) {
  if (
    !(await requireAutomationAuth(
      request,
      "POST /api/google-ads/rsa/preview",
      ApiScope.GOOGLE_ADS_READ
    ))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RsaUpdateBody;
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

  if (!body.adId || !body.adGroupId) {
    return NextResponse.json(
      { error: "adId and adGroupId are required" },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_ADS_SCRIPTS_ROOT) {
    return NextResponse.json(
      {
        error: "Python bridge not configured",
        message:
          "Set GOOGLE_ADS_SCRIPTS_ROOT in .env to enable RSA copy updates.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await callPythonBridge("lib.services.rsa", {
      customerId,
      adId: body.adId,
      adGroupId: body.adGroupId,
      campaignId: body.campaignId,
      headlines: body.headlines,
      descriptions: body.descriptions,
      execute: false,
      scriptName: "crm.rsa.preview",
      actor: "crm",
    });
    return NextResponse.json({ preview: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Python bridge failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
