/**
 * Server-only client for self-hosted n8n REST API.
 * @see https://docs.n8n.io/api/
 */

function baseUrl(): string {
  return (process.env.N8N_BASE_URL ?? "").replace(/\/$/, "");
}

export function n8nConfigured(): boolean {
  return Boolean(baseUrl() && process.env.N8N_API_KEY);
}

export function getN8nPublicBaseUrl(): string {
  return baseUrl();
}

export type N8nWorkflowSummary = {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string | null;
};

function apiKey(): string {
  return process.env.N8N_API_KEY ?? "";
}

async function n8nFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = baseUrl();
  const key = apiKey();
  const url = `${base}/api/v1${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-N8N-API-KEY": key,
      ...init?.headers,
    },
    cache: "no-store",
  });
  return res;
}

export async function listN8nWorkflows(): Promise<N8nWorkflowSummary[]> {
  const res = await n8nFetch("/workflows?limit=250");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n ${res.status}: ${text.slice(0, 300)}`);
  }
  const json: unknown = await res.json();
  const rows = extractWorkflowRows(json);
  return rows.map((w: Record<string, unknown>) => ({
    id: String(w.id ?? ""),
    name: typeof w.name === "string" ? w.name : "Untitled",
    active: Boolean(w.active),
    updatedAt:
      typeof w.updatedAt === "string"
        ? w.updatedAt
        : typeof w.updated_at === "string"
          ? w.updated_at
          : null,
  }));
}

function extractWorkflowRows(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) {
    return json as Record<string, unknown>[];
  }
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.data)) {
      return o.data as Record<string, unknown>[];
    }
    if (Array.isArray(o.workflows)) {
      return o.workflows as Record<string, unknown>[];
    }
  }
  return [];
}

/**
 * n8n editor URL for a workflow (opens in new tab).
 */
export function n8nWorkflowEditorUrl(workflowId: string): string {
  const base = baseUrl();
  if (!base) return "#";
  return `${base}/workflow/${encodeURIComponent(workflowId)}`;
}

export async function setN8nWorkflowActive(
  workflowId: string,
  active: boolean
): Promise<void> {
  const id = encodeURIComponent(workflowId);
  const path = active
    ? `/workflows/${id}/activate`
    : `/workflows/${id}/deactivate`;
  const res = await n8nFetch(path, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n ${res.status}: ${text.slice(0, 300)}`);
  }
}
