import { gaqlDateRange } from "./format";

export function accountSummaryQuery(days: number): string {
  const range = gaqlDateRange(days);
  return `
    SELECT
      customer.descriptive_name,
      customer.currency_code,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions
    FROM customer
    WHERE segments.date DURING ${range}
  `;
}

export function campaignsWithMetricsQuery(days: number): string {
  const range = gaqlDateRange(days);
  return `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE campaign.status != 'REMOVED'
      AND segments.date DURING ${range}
    ORDER BY metrics.clicks DESC
  `;
}

export function positiveKeywordsQuery(campaignId?: string): string {
  const campFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";
  return `
    SELECT
      campaign.name,
      ad_group.name,
      ad_group.id,
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status
    FROM ad_group_criterion
    WHERE ad_group_criterion.type = KEYWORD
      AND ad_group_criterion.negative = FALSE
      AND ad_group_criterion.status != 'REMOVED'
      ${campFilter}
    ORDER BY campaign.name, ad_group.name
  `;
}

export function campaignNegativesQuery(campaignId?: string): string {
  const campFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";
  return `
    SELECT
      campaign.id,
      campaign_criterion.criterion_id,
      campaign_criterion.keyword.text,
      campaign_criterion.keyword.match_type
    FROM campaign_criterion
    WHERE campaign_criterion.type = KEYWORD
      AND campaign_criterion.negative = TRUE
      ${campFilter}
    ORDER BY campaign.name
  `;
}

export function accountNameQuery(): string {
  return `
    SELECT customer.id, customer.descriptive_name, customer.currency_code
    FROM customer
    LIMIT 1
  `;
}
