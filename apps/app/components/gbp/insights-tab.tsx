"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { NotConfigured } from "./business-profile-view";

type InsightMetric = {
  metric: string;
  total: number;
  series: { date: string; value: number }[];
};

type InsightsResponse = {
  metrics: InsightMetric[];
  notConfigured?: boolean;
  error?: string;
};

const RANGES = [7, 30, 90] as const;

function metricTotal(metrics: InsightMetric[], name: string): number {
  return metrics.find((m) => m.metric === name)?.total ?? 0;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function InsightsTab({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string | null;
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ range: String(range) });
      if (clientId) params.set("clientId", clientId);
      const res = await fetch(`/api/gbp/insights?${params.toString()}`);
      const json = (await res.json()) as InsightsResponse;
      if (res.status === 404 && json.notConfigured) {
        setNotConfigured(true);
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Failed to load insights");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [clientId, range]);

  useEffect(() => {
    void load();
  }, [load]);

  if (notConfigured) return <NotConfigured clientName={clientName} />;

  const metrics = data?.metrics ?? [];

  const desktopMaps = metricTotal(metrics, "BUSINESS_IMPRESSIONS_DESKTOP_MAPS");
  const desktopSearch = metricTotal(metrics, "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH");
  const mobileMaps = metricTotal(metrics, "BUSINESS_IMPRESSIONS_MOBILE_MAPS");
  const mobileSearch = metricTotal(metrics, "BUSINESS_IMPRESSIONS_MOBILE_SEARCH");

  const mapsTotal = desktopMaps + mobileMaps;
  const searchTotal = desktopSearch + mobileSearch;
  const impressionsTotal = mapsTotal + searchTotal;

  const cards: { label: string; value: number }[] = [
    { label: "Total impressions", value: impressionsTotal },
    { label: "Direction requests", value: metricTotal(metrics, "DIRECTION_REQUESTS") },
    { label: "Website clicks", value: metricTotal(metrics, "WEBSITE_CLICKS") },
    { label: "Call clicks", value: metricTotal(metrics, "CALL_CLICKS") },
    { label: "Bookings", value: metricTotal(metrics, "BUSINESS_BOOKINGS") },
    { label: "Food orders", value: metricTotal(metrics, "BUSINESS_FOOD_ORDERS") },
  ];

  return (
    <div className="space-y-4">
      {/* Range picker */}
      <div className="flex items-center gap-2">
        {RANGES.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={range === r ? "default" : "outline"}
            onClick={() => setRange(r)}
            disabled={loading}
          >
            {r}d
          </Button>
        ))}
        {loading && (
          <span className="text-xs text-muted-foreground">Loading…</span>
        )}
      </div>

      {error ? (
        <p className="text-sm text-destructive py-4" role="alert">
          {error}
        </p>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ label, value }) => (
              <Card key={label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {loading && !data ? "—" : formatNumber(value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Maps vs Search split */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Impressions — Maps vs Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 font-medium">Surface</th>
                    <th className="py-2 font-medium text-right">Desktop</th>
                    <th className="py-2 font-medium text-right">Mobile</th>
                    <th className="py-2 font-medium text-right">Total</th>
                    <th className="py-2 font-medium text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2">Google Maps</td>
                    <td className="py-2 text-right">{formatNumber(desktopMaps)}</td>
                    <td className="py-2 text-right">{formatNumber(mobileMaps)}</td>
                    <td className="py-2 text-right font-medium">
                      {formatNumber(mapsTotal)}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {impressionsTotal > 0
                        ? `${Math.round((mapsTotal / impressionsTotal) * 100)}%`
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Google Search</td>
                    <td className="py-2 text-right">{formatNumber(desktopSearch)}</td>
                    <td className="py-2 text-right">{formatNumber(mobileSearch)}</td>
                    <td className="py-2 text-right font-medium">
                      {formatNumber(searchTotal)}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {impressionsTotal > 0
                        ? `${Math.round((searchTotal / impressionsTotal) * 100)}%`
                        : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
