import { getClients } from "@/lib/server/actions/clients";
import { ReportingView } from "@/components/analytics/reporting-view";

export const dynamic = "force-dynamic";

export default async function ReportingPage({
  searchParams,
}: {
  searchParams: { clientId?: string };
}) {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reporting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unified view: paid performance, organic search, and website traffic.
        </p>
      </div>
      <ReportingView
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        initialClientId={searchParams.clientId}
      />
    </div>
  );
}
