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

// --- Phase 2 additions ---

export function keywordPerformanceQuery(
  days: number,
  campaignId?: string
): string {
  const range = gaqlDateRange(days);
  const campFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";
  return `
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.quality_info.quality_score,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group_criterion
    WHERE ad_group_criterion.type = KEYWORD
      AND ad_group_criterion.negative = FALSE
      AND ad_group_criterion.status != 'REMOVED'
      AND segments.date DURING ${range}
      ${campFilter}
    ORDER BY metrics.clicks DESC
  `;
}

export function searchTermsQuery(
  days: number,
  campaignId?: string
): string {
  const range = gaqlDateRange(days);
  const campFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";
  return `
    SELECT
      search_term_view.search_term,
      search_term_view.status,
      segments.keyword.info.text,
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.conversions
    FROM search_term_view
    WHERE segments.date DURING ${range}
      ${campFilter}
    ORDER BY metrics.clicks DESC
  `;
}

export function rsaAdCopyQuery(campaignId?: string): string {
  const campFilter = campaignId ? `AND campaign.id = ${campaignId}` : "";
  return `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.policy_summary.approval_status,
      ad_group.id,
      ad_group.name,
      campaign.id,
      campaign.name
    FROM ad_group_ad
    WHERE ad_group_ad.ad.type = RESPONSIVE_SEARCH_AD
      AND ad_group_ad.status != 'REMOVED'
      ${campFilter}
    ORDER BY campaign.name, ad_group.name
  `;
}
