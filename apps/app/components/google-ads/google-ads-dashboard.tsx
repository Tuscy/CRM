"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@stky/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import type { GoogleAdsDashboard } from "@/lib/google-ads/types";
import { OverviewTab } from "@/components/google-ads/tabs/overview-tab";
import { KeywordsTab } from "@/components/google-ads/tabs/keywords-tab";
import { SearchTermsTab } from "@/components/google-ads/tabs/search-terms-tab";
import { AdCopyTab } from "@/components/google-ads/tabs/ad-copy-tab";

type ConnectionOption = {
  googleAdsCustomerId: string;
  displayName: string | null;
  label: string | null;
  clientId: string | null;
  clientName: string | null;
};

type AccessibleOption = {
  customerId: string;
};

type TabId = "overview" | "keywords" | "search-terms" | "ad-copy";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "keywords", label: "Keywords" },
  { id: "search-terms", label: "Search Terms" },
  { id: "ad-copy", label: "Ad Copy" },
];

export function GoogleAdsDashboardView({
  connections,
  accessibleCustomers,
  clients,
  initialCustomerId,
  initialClientFilter,
  envReady,
}: {
  connections: ConnectionOption[];
  accessibleCustomers: AccessibleOption[];
  clients: { id: string; name: string }[];
  initialCustomerId?: string;
  initialClientFilter?: string;
  envReady: boolean;
}) {
  const [clientFilter, setClientFilter] = useState(initialClientFilter ?? "");
  const [selectedId, setSelectedId] = useState(initialCustomerId ?? "");
  const [manualId, setManualId] = useState(initialCustomerId ?? "");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<GoogleAdsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const accountOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accessibleCustomers) {
      map.set(a.customerId, a.customerId);
    }
    for (const c of connections) {
      const label =
        c.displayName ||
        c.label ||
        c.clientName ||
        c.googleAdsCustomerId;
      map.set(c.googleAdsCustomerId, `${label} (${c.googleAdsCustomerId})`);
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [accessibleCustomers, connections]);

  const filteredOptions = useMemo(() => {
    if (!clientFilter) return accountOptions;
    const linked = new Set(
      connections
        .filter((c) => c.clientId === clientFilter)
        .map((c) => c.googleAdsCustomerId)
    );
    return accountOptions.filter((o) => linked.has(o.id));
  }, [accountOptions, clientFilter, connections]);

  const loadDashboard = useCallback(
    async (customerId: string, refresh = false) => {
      if (!customerId || customerId.length < 10) {
        setError("Enter a valid 10-digit Ads customer ID");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({
          customerId,
          days: String(days),
        });
        if (refresh) q.set("refresh", "1");
        const res = await fetch(`/api/google-ads/dashboard?${q}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Failed to load dashboard");
          setData(null);
          return;
        }
        setData(json as GoogleAdsDashboard);
        setSelectedId(customerId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [days]
  );

  useEffect(() => {
    if (initialCustomerId && envReady) {
      void loadDashboard(initialCustomerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [initialCustomerId, envReady]);

  if (!envReady) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Google Ads API credentials are not set on the server. Add{" "}
            <code className="text-xs">GOOGLE_ADS_*</code> variables to{" "}
            <code className="text-xs">CRM/.env</code> (see{" "}
            <Link href="/dashboard/google-ads/settings" className="underline">
              Settings
            </Link>
            ).
          </p>
        </CardContent>
      </Card>
    );
  }

  const currency = data?.account.currencyCode ?? "GBP";

  return (
    <div className="space-y-6">
      {/* ── Account selector card (unchanged) ─────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <div className="min-w-[180px]">
            <label className="text-sm font-medium">Filter by CRM client</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
            >
              <option value="">All accounts</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[220px] flex-1">
            <label className="text-sm font-medium">Ads account</label>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setManualId(e.target.value);
                if (e.target.value) void loadDashboard(e.target.value);
              }}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
            >
              <option value="">Select account…</option>
              {filteredOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="text-sm font-medium">Or enter Ads customer ID</label>
            <input
              value={manualId}
              onChange={(e) => setManualId(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
              placeholder="10 digits"
            />
          </div>
          <div className="w-28">
            <label className="text-sm font-medium">Period</label>
            <select
              value={days}
              onChange={(e) => {
                const d = Number(e.target.value);
                setDays(d);
                const id = manualId || selectedId;
                if (id.length >= 10) void loadDashboard(id);
              }}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          <Button
            type="button"
            onClick={() => void loadDashboard(manualId, true)}
            disabled={loading}
          >
            {loading ? "Loading…" : "Load"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Error display (unchanged) ──────────────────────────────────── */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* ── Data area with tabs ────────────────────────────────────────── */}
      {data && (
        <>
          {/* Account name / date range header */}
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-lg font-semibold">
              {data.account.descriptiveName}
            </h2>
            <span className="text-sm text-muted-foreground font-mono">
              {data.account.customerId}
            </span>
            <span className="text-xs text-muted-foreground">
              {data.dateRange.label}
              {data.cachedAt
                ? ` · cached ${new Date(data.cachedAt).toLocaleTimeString()}`
                : ""}
            </span>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content — lazy per tab */}
          {activeTab === "overview" && <OverviewTab data={data} />}

          {activeTab === "keywords" && (
            <KeywordsTab
              customerId={selectedId}
              days={days}
              campaigns={data.campaigns}
              currency={currency}
            />
          )}

          {activeTab === "search-terms" && (
            <SearchTermsTab
              customerId={selectedId}
              days={days}
              campaigns={data.campaigns}
            />
          )}

          {activeTab === "ad-copy" && (
            <AdCopyTab
              customerId={selectedId}
              campaigns={data.campaigns}
            />
          )}
        </>
      )}
    </div>
  );
}
