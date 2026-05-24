import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/lib/server/actions/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";

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
          {client.companyName ? (
            <p className="text-sm text-muted-foreground">{client.companyName}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {client.primaryContactEmail}
          </p>
        </div>
      </div>
      {(client.industry ||
        client.services ||
        client.contactPhone ||
        client.contactAddress ||
        client.companiesHouseNumber ||
        client.billingPeriod ||
        client.billingPrice != null) && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            {client.industry ? (
              <div>
                <span className="font-medium">Industry</span>
                <p className="text-muted-foreground">{client.industry}</p>
              </div>
            ) : null}
            {client.services ? (
              <div className="sm:col-span-2">
                <span className="font-medium">Services</span>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {client.services}
                </p>
              </div>
            ) : null}
            {client.contactPhone ? (
              <div>
                <span className="font-medium">Phone</span>
                <p className="text-muted-foreground">{client.contactPhone}</p>
              </div>
            ) : null}
            {client.contactAddress ? (
              <div className="sm:col-span-2">
                <span className="font-medium">Address</span>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {client.contactAddress}
                </p>
              </div>
            ) : null}
            {client.companiesHouseNumber ? (
              <div>
                <span className="font-medium">Companies House</span>
                <p className="text-muted-foreground">
                  {client.companiesHouseNumber}
                </p>
              </div>
            ) : null}
            {client.billingPeriod || client.billingPrice != null ? (
              <div>
                <span className="font-medium">Billing</span>
                <p className="text-muted-foreground">
                  {client.billingPrice != null
                    ? `${client.billingCurrency ?? "USD"} ${client.billingPrice.toString()}`
                    : null}
                  {client.billingPeriod
                    ? `${client.billingPrice != null ? " · " : ""}${client.billingPeriod}`
                    : null}
                </p>
                {client.billingNotes ? (
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                    {client.billingNotes}
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              {client.memberships.length} user
              {client.memberships.length !== 1 ? "s" : ""} with access to the client
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
        <Card>
          <CardHeader>
            <CardTitle>Google Ads</CardTitle>
          </CardHeader>
          <CardContent>
            {client.googleAdsConnections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Ads accounts linked.{" "}
                <Link
                  href="/dashboard/google-ads/settings"
                  className="underline hover:text-foreground"
                >
                  Add a mapping
                </Link>{" "}
                or open the{" "}
                <Link
                  href={`/dashboard/google-ads?clientId=${client.id}`}
                  className="underline hover:text-foreground"
                >
                  Google Ads tab
                </Link>
                .
              </p>
            ) : (
              <ul className="text-sm text-muted-foreground space-y-2">
                {client.googleAdsConnections.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={`/dashboard/google-ads?adsCustomerId=${g.googleAdsCustomerId}&clientId=${client.id}`}
                      className="underline hover:text-foreground"
                    >
                      {g.displayName ?? g.label ?? g.googleAdsCustomerId}
                    </Link>
                    <span className="font-mono text-xs ml-1">
                      ({g.googleAdsCustomerId})
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

