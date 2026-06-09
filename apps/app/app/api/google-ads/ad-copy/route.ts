import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { getGoogleAdsEnvStatus } from "@/lib/google-ads/env";
import { normalizeCustomerId } from "@/lib/google-ads/format";
import { query, parseGoogleAdsError } from "@/lib/google-ads/client";
import { rsaAdCopyQuery } from "@/lib/google-ads/queries";
import { prisma } from "@stky/db";
import type { RsaAdRow, RsaAsset, AdCopyResponse } from "@/lib/google-ads/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type GaqlRow = Record<string, unknown>;

function str(v: unknown): string {
  return String(v ?? "");
}

function getNested(row: GaqlRow, ...keys: string[]): unknown {
  let cur: unknown = row;
  for (const key of keys) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** Maps ServedAssetFieldType enum value to a readable pin label */
function pinnedFieldLabel(v: unknown): string | null {
  if (v == null || v === 0 || v === "UNSPECIFIED" || v === "UNKNOWN") return null;
  // May arrive as number or string from the API
  const map: Record<string | number, string> = {
    1: "HEADLINE_1",
    2: "HEADLINE_2",
    3: "HEADLINE_3",
    4: "DESCRIPTION_1",
    5: "DESCRIPTION_2",
    HEADLINE_1: "HEADLINE_1",
    HEADLINE_2: "HEADLINE_2",
    HEADLINE_3: "HEADLINE_3",
    DESCRIPTION_1: "DESCRIPTION_1",
    DESCRIPTION_2: "DESCRIPTION_2",
  };
  return map[String(v)] ?? String(v);
}

function mapAssets(raw: unknown): RsaAsset[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const obj = item as Record<string, unknown>;
    return {
      text: str(obj.text),
      pinnedField: pinnedFieldLabel(obj.pinned_field),
    };
  });
}

function mapRows(rows: GaqlRow[]): RsaAdRow[] {
  return rows.map((row) => {
    const rsa = getNested(
      row,
      "ad_group_ad",
      "ad",
      "responsive_search_ad"
    ) as Record<string, unknown> | null | undefined;

    return {
      adId: str(getNested(row, "ad_group_ad", "ad", "id")),
      campaignId: str(getNested(row, "campaign", "id")),
      campaign: str(getNested(row, "campaign", "name")),
      adGroupId: str(getNested(row, "ad_group", "id")),
      adGroup: str(getNested(row, "ad_group", "name")),
      headlines: mapAssets(rsa?.headlines),
      descriptions: mapAssets(rsa?.descriptions),
      approvalStatus: str(
        getNested(row, "ad_group_ad", "policy_summary", "approval_status")
      ),
    };
  });
}

export async function GET(request: NextRequest) {
  if (
    !(await requireAutomationAuth(
      request,
      "GET /api/google-ads/ad-copy",
      ApiScope.GOOGLE_ADS_READ
    ))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = getGoogleAdsEnvStatus();
  if (!env.ready) {
    return NextResponse.json(
      { error: "Google Ads credentials not configured", env },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const customerId = normalizeCustomerId(searchParams.get("customerId") ?? "");
  const campaignId = searchParams.get("campaignId") ?? undefined;

  if (customerId.length < 10) {
    return NextResponse.json(
      { error: "customerId query param required (10-digit Ads account ID)" },
      { status: 400 }
    );
  }

  try {
    const [rows, auditRecords] = await Promise.all([
      query<GaqlRow>(customerId, rsaAdCopyQuery(campaignId)),
      prisma.googleAdsAuditLog.findMany({
        where: { customerId, operation: "rsa_update" },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const response: AdCopyResponse = {
      ads: mapRows(rows),
      auditLogs: auditRecords.map((r) => ({
        id: r.id,
        actorUserId: r.actorUserId ?? null,
        operation: r.operation,
        execute: r.execute,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: parseGoogleAdsError(err) },
      { status: 502 }
    );
  }
}
