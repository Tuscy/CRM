const BASE_URL = "https://api.company-information.service.gov.uk";

export type CompaniesHouseSearchItem = {
  companyNumber: string;
  title: string;
  status: string | null;
  addressSnippet: string | null;
};

export type CompaniesHouseCompanyDetails = {
  companyNumber: string;
  companyName: string;
  companyStatus: string | null;
  contactAddress: string | null;
  industry: string | null;
};

type ChAddress = {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  premises?: string;
};

function getApiKey(): string | null {
  const key = process.env.COMPANIES_HOUSE_API_KEY?.trim();
  return key || null;
}

export function getCompaniesHouseEnvStatus(): {
  configured: boolean;
} {
  return { configured: Boolean(getApiKey()) };
}

function authHeader(): string {
  const key = getApiKey();
  if (!key) {
    throw new Error("Companies House API key is not configured");
  }
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function chFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (res.status === 401) {
    throw new Error("Companies House API authentication failed");
  }
  if (res.status === 404) {
    throw new Error("Company not found");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text || `Companies House API error (${res.status})`
    );
  }

  return res.json() as Promise<T>;
}

function formatAddress(addr: ChAddress | undefined | null): string | null {
  if (!addr) return null;
  const parts = [
    addr.premises,
    addr.address_line_1,
    addr.address_line_2,
    addr.locality,
    addr.region,
    addr.postal_code,
    addr.country,
  ].filter((p): p is string => Boolean(p?.trim()));
  return parts.length > 0 ? parts.join(", ") : null;
}

export async function searchCompanies(
  query: string,
  itemsPerPage = 10
): Promise<CompaniesHouseSearchItem[]> {
  const q = query.trim();
  if (q.length < 2) {
    throw new Error("Enter at least 2 characters to search");
  }

  const params = new URLSearchParams({
    q,
    items_per_page: String(Math.min(Math.max(itemsPerPage, 1), 10)),
  });

  const data = await chFetch<{
    items?: Array<{
      title?: string;
      company_number?: string;
      company_status?: string;
      address_snippet?: string;
    }>;
  }>(`/search/companies?${params.toString()}`);

  return (data.items ?? [])
    .filter((item) => item.company_number && item.title)
    .map((item) => ({
      companyNumber: item.company_number!,
      title: item.title!,
      status: item.company_status ?? null,
      addressSnippet: item.address_snippet ?? null,
    }));
}

export async function getCompanyDetails(
  companyNumber: string
): Promise<CompaniesHouseCompanyDetails> {
  const num = companyNumber.trim().replace(/\s/g, "");
  if (!num) {
    throw new Error("Company number is required");
  }

  const profile = await chFetch<{
    company_name?: string;
    company_number?: string;
    company_status?: string;
    registered_office_address?: ChAddress;
    sic_codes?: string[];
  }>(`/company/${encodeURIComponent(num)}`);

  const address =
    formatAddress(profile.registered_office_address) ??
    (await chFetch<{ registered_office_address?: ChAddress }>(
      `/company/${encodeURIComponent(num)}/registered-office-address`
    )
      .then((r) => formatAddress(r.registered_office_address))
      .catch(() => null));

  const sicCodes = profile.sic_codes?.filter(Boolean) ?? [];
  const industry =
    sicCodes.length > 0 ? `SIC: ${sicCodes.join(", ")}` : null;

  return {
    companyNumber: profile.company_number ?? num,
    companyName: profile.company_name ?? "",
    companyStatus: profile.company_status ?? null,
    contactAddress: address,
    industry,
  };
}

export function parseCompaniesHouseError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Companies House request failed";
}
