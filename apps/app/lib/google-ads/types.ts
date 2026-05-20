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
