import { prisma } from "@stky/db";
import { query, parseGoogleAdsError } from "./client";
import {
  accountSummaryQuery,
  campaignsWithMetricsQuery,
  positiveKeywordsQuery,
  campaignNegativesQuery,
  accountNameQuery,
} from "./queries";
import { microsToUnits, gaqlDateRange, normalizeCustomerId } from "./format";
import { getCachedDashboard, setCachedDashboard } from "./cache";
import type {
  GoogleAdsDashboard,
  GoogleAdsSummary,
  GoogleAdsCampaignRow,
  GoogleAdsKeywordRow,
  GoogleAdsNegativeRow,
} from "./types";

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

function aggregateSummary(rows: GaqlRow[]): GoogleAdsSummary {
  let impressions = 0;
  let clicks = 0;
  let costMicros = 0;
  let conversions = 0;
  for (const row of rows) {
    impressions += num(getNested(row, "metrics", "impressions"));
    clicks += num(getNested(row, "metrics", "clicks"));
    costMicros += num(getNested(row, "metrics", "cost_micros"));
    conversions += num(getNested(row, "metrics", "conversions"));
  }
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const averageCpc = clicks > 0 ? microsToUnits(costMicros) / clicks : 0;
  const cost = microsToUnits(costMicros);
  const conversionRate = clicks > 0 ? conversions / clicks : 0;
  return {
    impressions,
    clicks,
    ctr,
    averageCpc,
    cost,
    conversions,
    conversionRate,
  };
}

function mapCampaigns(rows: GaqlRow[]): GoogleAdsCampaignRow[] {
  const byId = new Map<string, GoogleAdsCampaignRow>();
  for (const row of rows) {
    const id = str(getNested(row, "campaign", "id"));
    if (!id) continue;
    const existing = byId.get(id);
    const impressions = num(getNested(row, "metrics", "impressions"));
    const clicks = num(getNested(row, "metrics", "clicks"));
    const costMicros = num(getNested(row, "metrics", "cost_micros"));
    const conversions = num(getNested(row, "metrics", "conversions"));
    if (existing) {
      existing.impressions += impressions;
      existing.clicks += clicks;
      existing.cost += microsToUnits(costMicros);
      existing.conversions += conversions;
      existing.ctr =
        existing.impressions > 0 ? existing.clicks / existing.impressions : 0;
    } else {
      byId.set(id, {
        id,
        name: str(getNested(row, "campaign", "name")),
        status: str(getNested(row, "campaign", "status")),
        channelType: str(getNested(row, "campaign", "advertising_channel_type")),
        budgetMicros: num(getNested(row, "campaign_budget", "amount_micros")),
        impressions,
        clicks,
        ctr: impressions > 0 ? clicks / impressions : 0,
        cost: microsToUnits(costMicros),
        conversions,
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.clicks - a.clicks);
}

function mapKeywords(rows: GaqlRow[]): GoogleAdsKeywordRow[] {
  return rows.map((row) => ({
    campaign: str(getNested(row, "campaign", "name")),
    adGroup: str(getNested(row, "ad_group", "name")),
    adGroupId: str(getNested(row, "ad_group", "id")),
    criterionId: str(getNested(row, "ad_group_criterion", "criterion_id")),
    text: str(getNested(row, "ad_group_criterion", "keyword", "text")),
    matchType: str(
      getNested(row, "ad_group_criterion", "keyword", "match_type")
    ),
    status: str(getNested(row, "ad_group_criterion", "status")),
  }));
}

function mapNegatives(rows: GaqlRow[]): GoogleAdsNegativeRow[] {
  return rows.map((row) => ({
    campaignId: str(getNested(row, "campaign", "id")),
    criterionId: str(getNested(row, "campaign_criterion", "criterion_id")),
    text: str(getNested(row, "campaign_criterion", "keyword", "text")),
    matchType: str(
      getNested(row, "campaign_criterion", "keyword", "match_type")
    ),
  }));
}

export async function getDashboard(params: {
  adsCustomerId: string;
  days?: number;
  skipCache?: boolean;
}): Promise<GoogleAdsDashboard> {
  const customerId = normalizeCustomerId(params.adsCustomerId);
  const days = params.days ?? 30;

  if (!params.skipCache) {
    const cached = getCachedDashboard(customerId, days);
    if (cached) return cached;
  }

  try {
    const [accountRows, summaryRows, campaignRows, keywordRows, negativeRows] =
      await Promise.all([
        query<GaqlRow>(customerId, accountNameQuery()),
        query<GaqlRow>(customerId, accountSummaryQuery(days)),
        query<GaqlRow>(customerId, campaignsWithMetricsQuery(days)),
        query<GaqlRow>(customerId, positiveKeywordsQuery()),
        query<GaqlRow>(customerId, campaignNegativesQuery()),
      ]);

    const accountRow = accountRows[0] ?? summaryRows[0];
    const descriptiveName =
      str(getNested(accountRow, "customer", "descriptive_name")) || customerId;
    const currencyCode =
      str(getNested(accountRow, "customer", "currency_code")) || "GBP";

    const dashboard: GoogleAdsDashboard = {
      account: {
        customerId,
        descriptiveName,
        currencyCode,
      },
      dateRange: { days, label: gaqlDateRange(days).replace(/_/g, " ") },
      summary: aggregateSummary(summaryRows),
      campaigns: mapCampaigns(campaignRows),
      keywords: mapKeywords(keywordRows),
      negatives: mapNegatives(negativeRows),
    };

    setCachedDashboard(customerId, days, dashboard);

    await prisma.googleAdsConnection.updateMany({
      where: { googleAdsCustomerId: customerId },
      data: { lastSyncedAt: new Date(), displayName: descriptiveName },
    });

    return dashboard;
  } catch (err) {
    throw new Error(parseGoogleAdsError(err));
  }
}

export async function fetchAccountDisplayName(
  adsCustomerId: string
): Promise<string | null> {
  try {
    const rows = await query<GaqlRow>(
      normalizeCustomerId(adsCustomerId),
      accountNameQuery()
    );
    const name = str(getNested(rows[0], "customer", "descriptive_name"));
    return name || null;
  } catch {
    return null;
  }
}
