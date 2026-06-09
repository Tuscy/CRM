export type GoogleAdsEnvStatus = {
  developerToken: boolean;
  clientId: boolean;
  clientSecret: boolean;
  refreshToken: boolean;
  ready: boolean;
};

export type AccessibleCustomer = {
  customerId: string;
  resourceName: string;
};

export type GoogleAdsSummary = {
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
  conversions: number;
  conversionRate: number;
};

export type GoogleAdsCampaignRow = {
  id: string;
  name: string;
  status: string;
  channelType: string;
  budgetMicros: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
  conversions: number;
};

export type GoogleAdsKeywordRow = {
  campaign: string;
  adGroup: string;
  adGroupId: string;
  criterionId: string;
  text: string;
  matchType: string;
  status: string;
};

export type GoogleAdsNegativeRow = {
  campaignId: string;
  criterionId: string;
  text: string;
  matchType: string;
};

export type GoogleAdsDashboard = {
  account: {
    customerId: string;
    descriptiveName: string;
    currencyCode: string;
  };
  dateRange: { days: number; label: string };
  summary: GoogleAdsSummary;
  campaigns: GoogleAdsCampaignRow[];
  keywords: GoogleAdsKeywordRow[];
  negatives: GoogleAdsNegativeRow[];
  cachedAt?: string;
};

export type GoogleAdsConnectionDto = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  googleAdsCustomerId: string;
  label: string | null;
  displayName: string | null;
  lastSyncedAt: string | null;
};

// --- Phase 2 additions ---

export type KeywordPerformanceRow = {
  campaignId: string;
  campaign: string;
  adGroupId: string;
  adGroup: string;
  criterionId: string;
  text: string;
  matchType: string;
  status: string;
  qualityScore: number | null;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
  conversions: number;
};

export type SearchTermRow = {
  searchTerm: string;
  status: string;
  matchedKeyword: string | null;
  campaignId: string;
  campaign: string;
  adGroupId: string;
  adGroup: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
};

export type RsaAsset = {
  text: string;
  pinnedField: string | null; // "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3" | "DESCRIPTION_1" | "DESCRIPTION_2" | null
};

export type RsaAdRow = {
  adId: string;
  campaignId: string;
  campaign: string;
  adGroupId: string;
  adGroup: string;
  headlines: RsaAsset[];
  descriptions: RsaAsset[];
  approvalStatus: string;
};

export type GoogleAdsAuditLogEntry = {
  id: string;
  actorUserId: string | null;
  operation: string;
  execute: boolean;
  createdAt: string;
};

export type AdCopyResponse = {
  ads: RsaAdRow[];
  auditLogs: GoogleAdsAuditLogEntry[];
};

export type NegativeKeywordInput = {
  text: string;
  matchType: string;
  campaignId: string;
  adGroupId?: string;
};

export type PythonOperationResult = {
  success: boolean;
  operation?: string;
  resource_names?: string[];
  errors?: string[];
  dry_run_preview?: unknown;
  results?: PythonOperationResult[];
  /** @deprecated use success */
  ok?: boolean;
  message?: string;
  preview?: unknown;
  changes?: unknown[];
  [key: string]: unknown;
};
