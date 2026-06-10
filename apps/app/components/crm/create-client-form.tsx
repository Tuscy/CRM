"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { createClient } from "@/lib/server/actions/clients";

const inputClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const labelClass = "text-sm font-medium";

type SearchResult = {
  companyNumber: string;
  title: string;
  status: string | null;
  addressSnippet: string | null;
};

export function CreateClientForm() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companySearch, setCompanySearch] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companiesHouseNumber, setCompaniesHouseNumber] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactAddress, setContactAddress] = useState("");

  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [chConfirmed, setChConfirmed] = useState(false);
  const [services, setServices] = useState<string[]>([]);

  async function handleSearch() {
    const q = companySearch.trim();
    if (q.length < 2) {
      setSearchError("Enter at least 2 characters to search");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setHasSearched(false);
    setChConfirmed(false);

    try {
      const res = await fetch(
        `/api/companies-house/search?q=${encodeURIComponent(q)}`
      );
      const data = (await res.json()) as {
        items?: SearchResult[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Search failed");
      }
      setSearchResults(data.items ?? []);
      setHasSearched(true);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectCompany(item: SearchResult) {
    setLoadingProfile(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `/api/companies-house/company/${encodeURIComponent(item.companyNumber)}`
      );
      const data = (await res.json()) as {
        company?: {
          companyNumber: string;
          companyName: string;
          contactAddress: string | null;
          industry: string | null;
        };
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load company details");
      }

      const company = data.company;
      if (!company) {
        throw new Error("No company data returned");
      }

      setCompanyName(company.companyName);
      setCompaniesHouseNumber(company.companyNumber);
      setContactAddress(company.contactAddress ?? "");
      if (company.industry) {
        setIndustry(company.industry);
      }
      setChConfirmed(true);
      setSearchResults([]);
      setHasSearched(false);
    } catch (e) {
      setSearchError(
        e instanceof Error ? e.message : "Failed to load company details"
      );
    } finally {
      setLoadingProfile(false);
    }
  }

  function handleUseExistingName() {
    const name = companySearch.trim();
    if (!name) {
      setSearchError("Enter a company name first");
      return;
    }
    setCompanyName(name);
    setCompaniesHouseNumber("");
    setChConfirmed(false);
    setSearchResults([]);
    setHasSearched(false);
    setSearchError(null);
  }

  async function handleSubmit(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);
    setError(null);
    try {
      const client = await createClient({
        name: formData.get("name") as string,
        companyName: companyName || undefined,
        companiesHouseNumber: companiesHouseNumber || undefined,
        industry: industry || undefined,
        serviceNotes: (formData.get("serviceNotes") as string) || undefined,
        primaryContactEmail: formData.get("primaryContactEmail") as string,
        contactPhone: (formData.get("contactPhone") as string) || undefined,
        contactAddress: contactAddress || undefined,
        billingPeriod: (formData.get("billingPeriod") as string) || undefined,
        billingPrice: (formData.get("billingPrice") as string) || undefined,
        billingCurrency: (formData.get("billingCurrency") as string) || undefined,
        billingNotes: (formData.get("billingNotes") as string) || undefined,
        package: ((formData.get("package") as string) || undefined) as
          | "VOLTAGE"
          | "CHARGE"
          | "GRID"
          | undefined,
        services: services as ("BRANDING" | "WEB" | "ADS")[],
      });
      toast.success("Client created");
      router.push(`/dashboard/clients/${client.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create client");
      submittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New client</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={handleSubmit}
          className="space-y-8 max-w-2xl"
          aria-busy={pending}
        >
          <fieldset className="space-y-4">
            <legend className="text-base font-semibold">Basic</legend>
            <div>
              <label className={labelClass}>Contact name *</label>
              <input
                name="name"
                required
                placeholder="Jane Smith"
                className={inputClass}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Company lookup (UK)</p>
              <p className="text-xs text-muted-foreground">
                Search Companies House, pick a match, or use your own company
                name.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className={labelClass} htmlFor="companySearch">
                    Search by company name
                  </label>
                  <input
                    id="companySearch"
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSearch();
                      }
                    }}
                    placeholder="e.g. Acme Holdings Ltd"
                    className={inputClass}
                    disabled={loadingProfile}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleSearch()}
                  disabled={searching || loadingProfile}
                >
                  {searching ? "Searching…" : "Search"}
                </Button>
              </div>

              {searchError ? (
                <p className="text-sm text-destructive" role="alert">
                  {searchError}
                </p>
              ) : null}

              {loadingProfile ? (
                <p className="text-sm text-muted-foreground">
                  Loading company details…
                </p>
              ) : null}

              {hasSearched && searchResults.length > 0 ? (
                <ul className="space-y-2" role="listbox" aria-label="Search results">
                  {searchResults.map((item) => (
                    <li key={item.companyNumber}>
                      <button
                        type="button"
                        role="option"
                        onClick={() => void handleSelectCompany(item)}
                        disabled={loadingProfile}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
                      >
                        <span className="font-medium">{item.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.companyNumber}
                          {item.status ? ` · ${item.status}` : null}
                          {item.addressSnippet ? ` · ${item.addressSnippet}` : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {hasSearched && searchResults.length === 0 && !searching ? (
                <p className="text-sm text-muted-foreground">
                  No companies found for that name.
                </p>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseExistingName}
                disabled={loadingProfile}
              >
                Use existing name
              </Button>

              {chConfirmed && companiesHouseNumber ? (
                <p className="text-xs text-muted-foreground">
                  Linked to Companies House #{companiesHouseNumber}. Details
                  filled below — you can still edit them.
                </p>
              ) : null}
            </div>

            <div>
              <label className={labelClass}>Company name</label>
              <input
                name="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputClass}
              />
            </div>
            <input
              type="hidden"
              name="companiesHouseNumber"
              value={companiesHouseNumber}
            />
            <div>
              <label className={labelClass}>Industry</label>
              <input
                name="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Healthcare, SaaS"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Service notes</label>
              <textarea
                name="serviceNotes"
                rows={3}
                placeholder="e.g. Web design, SEO, Google Ads"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Package</label>
              <select name="package" className={inputClass} defaultValue="">
                <option value="">None</option>
                <option value="VOLTAGE">Voltage</option>
                <option value="CHARGE">Charge</option>
                <option value="GRID">Grid</option>
              </select>
            </div>
            <div>
              <p className={labelClass}>Active services</p>
              <div className="flex flex-wrap gap-3 mt-1">
                {(
                  [
                    ["BRANDING", "Branding"],
                    ["WEB", "Web"],
                    ["ADS", "Google Ads"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={services.includes(value)}
                      onChange={() =>
                        setServices((prev) =>
                          prev.includes(value)
                            ? prev.filter((s) => s !== value)
                            : [...prev, value]
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-base font-semibold">Contact</legend>
            <div>
              <label className={labelClass}>Email *</label>
              <input
                name="primaryContactEmail"
                type="email"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input name="contactPhone" type="tel" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea
                name="contactAddress"
                rows={2}
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                className={inputClass}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-base font-semibold">Billing</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Billing period</label>
                <select name="billingPeriod" className={inputClass} defaultValue="">
                  <option value="">Not set</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Price</label>
                <input
                  name="billingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <input
                name="billingCurrency"
                defaultValue="GBP"
                placeholder="USD"
                className={`${inputClass} max-w-[8rem]`}
              />
            </div>
            <div>
              <label className={labelClass}>Billing notes</label>
              <textarea
                name="billingNotes"
                rows={2}
                placeholder="Invoicing details, contract terms, etc."
                className={inputClass}
              />
            </div>
          </fieldset>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/clients">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={pending || loadingProfile}
              aria-disabled={pending || loadingProfile}
            >
              {pending ? "Creating…" : "Create client"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
