import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/lib/server/actions/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/clients"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to clients
          </Link>
          <h1 className="text-2xl font-bold mt-1">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            {client.primaryContactEmail}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {client.leads.length} lead{client.leads.length !== 1 ? "s" : ""} linked
              to this client.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Portal users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {client.clientUsers.length} user
              {client.clientUsers.length !== 1 ? "s" : ""} with access to the client
              portal.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {client.analytics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No GA4 connection yet. Configure a property ID and OAuth tokens in
                the database to enable analytics.
              </p>
            ) : (
              <ul className="text-sm text-muted-foreground space-y-1">
                {client.analytics.map((a) => (
                  <li key={a.id}>
                    Property: <span className="font-mono">{a.gaPropertyId}</span>
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

