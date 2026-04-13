import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { AutomationsWorkflowTable } from "@/components/automations/automations-workflow-table";
import { getAutomationsWorkflows } from "@/lib/server/actions/n8n-workflows";
import { getN8nPublicBaseUrl } from "@/lib/n8n/client";

export default async function AutomationsPage() {
  const { configured, workflows, error } = await getAutomationsWorkflows();
  const n8nBaseUrl = getN8nPublicBaseUrl();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Automations</h1>
      <p className="text-sm text-muted-foreground max-w-2xl">
        View and enable or disable n8n workflows. API calls run on the server; the
        n8n editor opens in a new tab.
      </p>

      {!configured ? (
        <Card>
          <CardHeader>
            <CardTitle>Configure n8n</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Set <code className="rounded bg-muted px-1 py-0.5">N8N_BASE_URL</code>{" "}
              (HTTPS origin, no trailing slash) and{" "}
              <code className="rounded bg-muted px-1 py-0.5">N8N_API_KEY</code>{" "}
              (n8n Settings → API) in the CRM environment. Never use{" "}
              <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_</code>{" "}
              for the API key.
            </p>
            <p>
              See <code className="rounded bg-muted px-1 py-0.5">CRM/README.md</code>{" "}
              for TLS, backups, and webhook notes.
            </p>
          </CardContent>
        </Card>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <AutomationsWorkflowTable
          workflows={workflows}
          n8nBaseUrl={n8nBaseUrl}
        />
      )}
    </div>
  );
}
