/**
 * Server-only client for managing n8n workflows via its REST API.
 * Mirrors the conventions in lib/n8n/client.ts but scoped to the create/update/
 * delete/activate lifecycle the Email Flows compiler needs.
 *
 * @see https://docs.n8n.io/api/
 */

function baseUrl(): string {
  return (process.env.N8N_BASE_URL ?? "").replace(/\/$/, "");
}

function apiKey(): string {
  return process.env.N8N_API_KEY ?? "";
}

export function n8nConfigured(): boolean {
  return Boolean(baseUrl() && apiKey());
}

/** Public webhook URL for a compiled flow's trigger. */
export function n8nWebhookUrl(webhookPath: string): string {
  return `${baseUrl()}/webhook/${webhookPath}`;
}

async function n8nFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!n8nConfigured()) {
    throw new Error(
      "n8n is not configured. Set N8N_BASE_URL and N8N_API_KEY in the CRM environment."
    );
  }
  return fetch(`${baseUrl()}/api/v1${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-N8N-API-KEY": apiKey(),
      ...init?.headers,
    },
    cache: "no-store",
  });
}

async function parseOrThrow(res: Response, action: string): Promise<unknown> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`n8n ${action} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json().catch(() => ({}));
}

function extractId(json: unknown): string {
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const data = (o.data ?? o) as Record<string, unknown>;
    if (data.id != null) return String(data.id);
  }
  throw new Error("n8n response did not include a workflow id");
}

export async function createN8nWorkflow(workflowJson: object): Promise<string> {
  const res = await n8nFetch("/workflows", {
    method: "POST",
    body: JSON.stringify(workflowJson),
  });
  const json = await parseOrThrow(res, "create workflow");
  return extractId(json);
}

export async function updateN8nWorkflow(
  id: string,
  workflowJson: object
): Promise<void> {
  const res = await n8nFetch(`/workflows/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(workflowJson),
  });
  await parseOrThrow(res, "update workflow");
}

export async function deleteN8nWorkflow(id: string): Promise<void> {
  const res = await n8nFetch(`/workflows/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  // 404 means it's already gone — treat as success.
  if (res.status === 404) return;
  await parseOrThrow(res, "delete workflow");
}

export async function activateN8nWorkflow(id: string): Promise<void> {
  const res = await n8nFetch(`/workflows/${encodeURIComponent(id)}/activate`, {
    method: "POST",
  });
  await parseOrThrow(res, "activate workflow");
}

export async function deactivateN8nWorkflow(id: string): Promise<void> {
  const res = await n8nFetch(
    `/workflows/${encodeURIComponent(id)}/deactivate`,
    { method: "POST" }
  );
  await parseOrThrow(res, "deactivate workflow");
}
