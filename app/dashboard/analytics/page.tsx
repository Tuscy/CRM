import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getClientAnalytics } from "@/lib/analytics/ga4";

export default async function AnalyticsPage() {
  const [leadCount, dealCount, wonDeals, pipelineValue] = await Promise.all([
    prisma.lead.count(),
    prisma.deal.count(),
    prisma.deal.count({ where: { stage: "WON" } }),
    prisma.deal.aggregate({
      _sum: { value: true },
      where: { stage: { not: "LOST" } },
    }),
  ]);

  // Optional: show GA4 metrics for a default client if configured.
  let gaSummary: { totalUsers: number; sessions: number } | null = null;
  try {
    const defaultClient = await prisma.analyticsConnection.findFirst();
    if (defaultClient) {
      const analytics = await getClientAnalytics({
        clientId: defaultClient.clientId,
        startDate: "30daysAgo",
        endDate: "today",
      });
      gaSummary = analytics.summary;
    }
  } catch {
    gaSummary = null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{leadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dealCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deals won
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{wonDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipeline value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${(pipelineValue._sum.value ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GA visitors (last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {gaSummary ? gaSummary.totalUsers.toLocaleString() : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GA sessions (last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {gaSummary ? gaSummary.sessions.toLocaleString() : "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
