import { redirect } from "next/navigation";
import { requireCurrentMembership } from "@stky/auth";
import { prisma } from "@stky/db";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import Link from "next/link";

export default async function ClientHomePage() {
  let clientUser;
  try {
    clientUser = await requireCurrentMembership();
  } catch {
    redirect("/client/login");
  }

  const [leadCount, recentLeads] = await Promise.all([
    prisma.lead.count({ where: { clientId: clientUser.clientId } }),
    prisma.lead.findMany({
      where: { clientId: clientUser.clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Welcome, {clientUser.client.name}
      </h1>
      <p className="text-muted-foreground text-sm">
        Overview of your leads and performance.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
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
              Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View deal stages in your{" "}
              <Link
                href="/client/leads"
                className="text-primary hover:underline font-medium"
              >
                leads list
              </Link>
              .
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track visitors and key pages in{" "}
              <Link
                href="/client/analytics"
                className="text-primary hover:underline font-medium"
              >
                Analytics
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent leads</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leads have been assigned to you yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="text-sm flex justify-between">
                  <span>{lead.name}</span>
                  <span className="text-muted-foreground">
                    {lead.company ?? lead.email}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

