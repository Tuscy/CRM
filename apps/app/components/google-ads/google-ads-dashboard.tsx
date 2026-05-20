"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@stky/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import type { GoogleAdsDashboard } from "@/lib/google-ads/types";
import { formatMoney, formatCtr, formatPercent } from "@/lib/google-ads/format";

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
      loadDashboard(initialCustomerId);
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
                if (e.target.value) loadDashboard(e.target.value);
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
                if (id.length >= 10) loadDashboard(id);
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
            onClick={() => loadDashboard(manualId, true)}
            disabled={loading}
          >
            {loading ? "Loading…" : "Load"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-lg font-semibold">{data.account.descriptiveName}</h2>
            <span className="text-sm text-muted-foreground font-mono">
              {data.account.customerId}
            </span>
            <span className="text-xs text-muted-foreground">
              {data.dateRange.label}
              {data.cachedAt ? ` · cached ${new Date(data.cachedAt).toLocaleTimeString()}` : ""}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard title="Impressions" value={data.summary.impressions.toLocaleString()} />
            <MetricCard title="Clicks" value={data.summary.clicks.toLocaleString()} />
            <MetricCard title="CTR" value={formatCtr(data.summary.ctr)} />
            <MetricCard
              title="Avg CPC"
              value={formatMoney(data.summary.averageCpc, currency)}
            />
            <MetricCard
              title="Cost"
              value={formatMoney(data.summary.cost, currency)}
            />
            <MetricCard
              title="Conversions"
              value={data.summary.conversions.toLocaleString()}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaigns</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Clicks</th>
                    <th className="py-2 pr-3">CTR</th>
                    <th className="py-2 pr-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-muted-foreground">
                        No campaign data for this period.
                      </td>
                    </tr>
                  ) : (
                    data.campaigns.map((c) => (
                      <tr key={c.id} className="border-b">
                        <td className="py-2 pr-3">{c.name}</td>
                        <td className="py-2 pr-3">{c.status}</td>
                        <td className="py-2 pr-3">{c.clicks}</td>
                        <td className="py-2 pr-3">{formatCtr(c.ctr)}</td>
                        <td className="py-2 pr-3">{formatMoney(c.cost, currency)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Keywords ({data.keywords.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground sticky top-0 bg-card">
                    <th className="py-2 pr-3">Keyword</th>
                    <th className="py-2 pr-3">Match</th>
                    <th className="py-2 pr-3">Campaign</th>
                    <th className="py-2 pr-3">Ad group</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.keywords.map((k, i) => (
                    <tr key={`${k.criterionId}-${i}`} className="border-b">
                      <td className="py-2 pr-3">{k.text}</td>
                      <td className="py-2 pr-3">{k.matchType}</td>
                      <td className="py-2 pr-3">{k.campaign}</td>
                      <td className="py-2 pr-3">{k.adGroup}</td>
                      <td className="py-2 pr-3">{k.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {data.negatives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Campaign negatives ({data.negatives.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto max-h-48">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Keyword</th>
                      <th className="py-2 pr-3">Match</th>
                      <th className="py-2 pr-3">Campaign ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.negatives.map((n, i) => (
                      <tr key={`${n.criterionId}-${i}`} className="border-b">
                        <td className="py-2 pr-3">{n.text}</td>
                        <td className="py-2 pr-3">{n.matchType}</td>
                        <td className="py-2 pr-3 font-mono">{n.campaignId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground">
            Conversion rate (clicks): {formatPercent(data.summary.conversionRate)}
          </p>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
