import Link from "next/link";
import { prisma } from "@stky/db";
import { getGoogleAdsEnvStatus } from "@/lib/google-ads/env";
import { listAccessibleCustomers } from "@/lib/google-ads/client";
import { listGoogleAdsConnections } from "@/lib/server/actions/google-ads";
import { getClients } from "@/lib/server/actions/clients";
import { GoogleAdsDashboardView } from "@/components/google-ads/google-ads-dashboard";

export const dynamic = "force-dynamic";

export default async function GoogleAdsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const clientId =
    typeof searchParams.clientId === "string"
      ? searchParams.clientId
      : undefined;

  const env = getGoogleAdsEnvStatus();
  const [connections, clients] = await Promise.all([
    listGoogleAdsConnections(),
    getClients(),
  ]);

  // Auto-select Ads account when clientId has exactly one linked connection
  let resolvedCustomerId =
    typeof searchParams.adsCustomerId === "string"
      ? searchParams.adsCustomerId
      : undefined;
  if (!resolvedCustomerId && clientId) {
    const linked = connections.filter((c) => c.clientId === clientId);
    if (linked.length === 1) {
      resolvedCustomerId = linked[0].googleAdsCustomerId;
    }
  }

  let accessibleCustomers: { customerId: string }[] = [];
  if (env.ready) {
    try {
      const list = await listAccessibleCustomers();
      accessibleCustomers = list.map((c) => ({
        customerId: c.customerId,
      }));
    } catch {
      accessibleCustomers = [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Google Ads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance and keywords for accounts under your manager (MCC).
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Settings
        </Link>
      </div>

      <GoogleAdsDashboardView
        connections={connections}
        accessibleCustomers={accessibleCustomers}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        initialCustomerId={resolvedCustomerId}
        initialClientFilter={clientId}
        envReady={env.ready}
      />
    </div>
  );
}
