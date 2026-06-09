"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import type { GoogleAdsDashboard } from "@/lib/google-ads/types";
import { formatMoney, formatCtr, formatPercent } from "@/lib/google-ads/format";

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

export function OverviewTab({ data }: { data: GoogleAdsDashboard }) {
  const currency = data.account.currencyCode ?? "GBP";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard
          title="Impressions"
          value={data.summary.impressions.toLocaleString()}
        />
        <MetricCard
          title="Clicks"
          value={data.summary.clicks.toLocaleString()}
        />
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
        <MetricCard
          title="Conv. Rate"
          value={formatPercent(data.summary.conversionRate)}
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
                <th className="py-2 pr-3">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 text-muted-foreground">
                    No campaign data for this period.
                  </td>
                </tr>
              ) : (
                data.campaigns.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-2 pr-3">{c.name}</td>
                    <td className="py-2 pr-3">{c.status}</td>
                    <td className="py-2 pr-3">{c.clicks.toLocaleString()}</td>
                    <td className="py-2 pr-3">{formatCtr(c.ctr)}</td>
                    <td className="py-2 pr-3">
                      {formatMoney(c.cost, currency)}
                    </td>
                    <td className="py-2 pr-3">{c.conversions.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {data.keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Keywords ({data.keywords.length}) —{" "}
              <span className="text-sm font-normal text-muted-foreground">
                basic list · see Keywords tab for performance data
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto max-h-64">
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
      )}

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
    </div>
  );
}
