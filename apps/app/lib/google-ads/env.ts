import type { GoogleAdsEnvStatus } from "./types";

export function getGoogleAdsEnvStatus(): GoogleAdsEnvStatus {
  const developerToken = Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim());
  const clientId = Boolean(process.env.GOOGLE_ADS_CLIENT_ID?.trim());
  const clientSecret = Boolean(process.env.GOOGLE_ADS_CLIENT_SECRET?.trim());
  const refreshToken = Boolean(process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim());
  return {
    developerToken,
    clientId,
    clientSecret,
    refreshToken,
    ready: developerToken && clientId && clientSecret && refreshToken,
  };
}

export function assertGoogleAdsEnv(): void {
  const status = getGoogleAdsEnvStatus();
  if (!status.ready) {
    throw new Error(
      "Google Ads API credentials are not configured. Set GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, and GOOGLE_ADS_REFRESH_TOKEN in the server environment."
    );
  }
}
