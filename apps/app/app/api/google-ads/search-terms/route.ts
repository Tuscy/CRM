import { NextRequest, NextResponse } from "next/server";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";
import { getGoogleAdsEnvStatus } from "@/lib/google-ads/env";
import { normalizeCustomerId } from "@/lib/google-ads/format";
import { query, parseGoogleAdsError } from "@/lib/google-ads/client";
import { searchTermsQuery } from "@/lib/google-ads/queries";
import type { SearchTermRow } from "@/lib/google-ads/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type GaqlRow = Record<string, unknown>;

function num(v: unknown): number {
  return Number(v ?? 0);
}

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

function mapRows(rows: GaqlRow[]): SearchTermRow[] {
  return rows.map((row) => ({
    searchTerm: str(getNested(row, "search_term_view", "search_term")),
    status: str(getNested(row, "search_term_view", "status")),
    matchedKeyword:
      str(getNested(row, "segments", "keyword", "info", "text")) || null,
    campaignId: str(getNested(row, "campaign", "id")),
    campaign: str(getNested(row, "campaign", "name")),
    adGroupId: str(getNested(row, "ad_group", "id")),
    adGroup: str(getNested(row, "ad_group", "name")),
    impressions: num(getNested(row, "metrics", "impressions")),
    clicks: num(getNested(row, "metrics", "clicks")),
    ctr: num(getNested(row, "metrics", "ctr")),
    conversions: num(getNested(row, "metrics", "conversions")),
  }));
}

export async function GET(request: NextRequest) {
  if (
    !(await requireAutomationAuth(
      request,
      "GET /api/google-ads/search-terms",
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
  const days = Math.min(
    90,
    Math.max(7, parseInt(searchParams.get("days") ?? "30", 10) || 30)
  );
  const campaignId = searchParams.get("campaignId") ?? undefined;

  if (customerId.length < 10) {
    return NextResponse.json(
      { error: "customerId query param required (10-digit Ads account ID)" },
      { status: 400 }
    );
  }

  try {
    const rows = await query<GaqlRow>(
      customerId,
      searchTermsQuery(days, campaignId)
    );
    return NextResponse.json({ searchTerms: mapRows(rows) });
  } catch (err) {
    return NextResponse.json(
      { error: parseGoogleAdsError(err) },
      { status: 502 }
    );
  }
}
