import { GoogleAdsApi } from "google-ads-api";
import { prisma } from "@stky/db";
import { assertGoogleAdsEnv } from "./env";
import { normalizeCustomerId } from "./format";
import type { AccessibleCustomer } from "./types";

let apiClient: GoogleAdsApi | null = null;

function getApiClient(): GoogleAdsApi {
  assertGoogleAdsEnv();
  if (!apiClient) {
    apiClient = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });
  }
  return apiClient;
}

export async function getLoginCustomerId(): Promise<string | null> {
  const settings = await prisma.googleAdsSettings.findUnique({
    where: { id: "default" },
  });
  return settings?.loginCustomerId
    ? normalizeCustomerId(settings.loginCustomerId)
    : null;
}

export async function getCustomerInstance(adsCustomerId: string) {
  const client = getApiClient();
  const customerId = normalizeCustomerId(adsCustomerId);
  const loginCustomerId = await getLoginCustomerId();

  return client.Customer({
    customer_id: customerId,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    ...(loginCustomerId ? { login_customer_id: loginCustomerId } : {}),
  });
}

export async function query<T = Record<string, unknown>>(
  adsCustomerId: string,
  gaql: string
): Promise<T[]> {
  const customer = await getCustomerInstance(adsCustomerId);
  const rows = await customer.query(gaql.trim());
  return rows as T[];
}

export async function listAccessibleCustomers(): Promise<AccessibleCustomer[]> {
  const client = getApiClient();
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN!;
  const response = await client.listAccessibleCustomers(refreshToken);
  const resourceNames =
    (response as { resource_names?: string[] }).resource_names ?? [];
  return resourceNames.map((resourceName) => {
    const id = resourceName.replace("customers/", "");
    return {
      customerId: normalizeCustomerId(id),
      resourceName,
    };
  });
}

export function parseGoogleAdsError(err: unknown): string {
  if (err instanceof Error) {
    const anyErr = err as Error & { errors?: { message?: string }[] };
    if (anyErr.errors?.length) {
      return anyErr.errors.map((e) => e.message ?? "Unknown error").join("; ");
    }
    return err.message;
  }
  return "Google Ads API request failed";
}
