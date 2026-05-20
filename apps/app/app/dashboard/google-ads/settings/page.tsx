import Link from "next/link";
import { getGoogleAdsEnvStatus } from "@/lib/google-ads/env";
import {
  getGoogleAdsSettings,
  listGoogleAdsConnections,
} from "@/lib/server/actions/google-ads";
import { getClients } from "@/lib/server/actions/clients";
import { GoogleAdsSettingsForm } from "@/components/google-ads/google-ads-settings-form";
import { GoogleAdsConnectionsForm } from "@/components/google-ads/google-ads-connections-form";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";

export const dynamic = "force-dynamic";

export default async function GoogleAdsSettingsPage() {
  const env = getGoogleAdsEnvStatus();
  const settings = await getGoogleAdsSettings();
  const [connections, clients] = await Promise.all([
    listGoogleAdsConnections(),
    getClients(),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/dashboard/google-ads"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Google Ads
        </Link>
        <h1 className="text-2xl font-bold mt-1">Google Ads settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manager account ID and mappings between CRM clients and Ads customer
          accounts. API secrets stay in server environment variables.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleAdsSettingsForm
            initialLoginCustomerId={settings?.loginCustomerId ?? ""}
            env={env}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleAdsConnectionsForm
            connections={connections}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Setup guide: copy credentials from your{" "}
        <code className="text-xs">google-ads/config/google-ads.yaml</code> into{" "}
        <code className="text-xs">CRM/.env</code>. See{" "}
        <code className="text-xs">CRM/docs/google-ads.md</code>.
      </p>
    </div>
  );
}
