import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

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
      </div>
    </div>
  );
}
