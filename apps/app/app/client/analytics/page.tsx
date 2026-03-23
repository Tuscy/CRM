import { redirect } from "next/navigation";
import { requireCurrentMembership } from "@stky/auth";
import { getClientAnalytics } from "@/lib/analytics/ga4";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";

export default async function ClientAnalyticsPage() {
  let clientUser;
  try {
    clientUser = await requireCurrentMembership();
  } catch {
    redirect("/client/login");
  }

  const analytics = await getClientAnalytics({
    clientId: clientUser.clientId,
    startDate: "30daysAgo",
    endDate: "today",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-muted-foreground">
        Visitors and sessions from your connected Google Analytics 4 property.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visitors (last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.summary.totalUsers.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sessions (last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analytics.summary.sessions.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No page data available yet.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {analytics.topPages.map((page) => (
                  <li
                    key={page.path}
                    className="flex justify-between gap-2 truncate"
                  >
                    <span className="truncate">{page.path}</span>
                    <span className="text-muted-foreground">
                      {page.views.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

