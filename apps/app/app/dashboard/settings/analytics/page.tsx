import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { listAnalyticsCredentials } from "@/lib/server/actions/analytics";
import { getClients } from "@/lib/server/actions/clients";
import { AnalyticsCredentialsForm } from "@/components/analytics/analytics-credentials-form";

export const dynamic = "force-dynamic";

export default async function AnalyticsSettingsPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string };
}) {
  const [credentials, allClients] = await Promise.all([
    listAnalyticsCredentials(),
    getClients(),
  ]);
  const clients = allClients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/dashboard/settings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Settings
        </Link>
        <h1 className="text-2xl font-bold mt-1">Analytics settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect GA4 properties and Search Console sites to enable the unified
          reporting page. Refresh tokens are encrypted at rest.
        </p>
      </div>

      {searchParams.connected && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          ✓ {searchParams.connected.toUpperCase()} connected successfully.
        </div>
      )}

      {searchParams.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          OAuth error: <code>{searchParams.error}</code>
          {searchParams.error === "no_refresh_token" && (
            <p className="mt-1">
              Google only returns a refresh token on first consent. To reconnect,
              visit{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                myaccount.google.com/permissions
              </a>{" "}
              and revoke access for this app, then try again.
            </p>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">GA4 &amp; Search Console credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsCredentialsForm
            credentials={credentials}
            clients={clients}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        The Google account you connect must have at least Viewer access to the
        GA4 property or Search Console site. Org-level credentials are used as
        a fallback when no client-specific credential is configured.
      </p>
    </div>
  );
}
