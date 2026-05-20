"use client";

import { useState } from "react";
import {
  upsertGoogleAdsConnection,
  deleteGoogleAdsConnection,
} from "@/lib/server/actions/google-ads";
import { Button } from "@stky/ui";
import type { GoogleAdsConnectionDto } from "@/lib/google-ads/types";

type ClientOption = { id: string; name: string };

export function GoogleAdsConnectionsForm({
  connections,
  clients,
}: {
  connections: GoogleAdsConnectionDto[];
  clients: ClientOption[];
}) {
  const [rows, setRows] = useState(connections);
  const [error, setError] = useState<string | null>(null);
  const [adsId, setAdsId] = useState("");
  const [clientId, setClientId] = useState("");
  const [label, setLabel] = useState("");

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await upsertGoogleAdsConnection({
        googleAdsCustomerId: adsId,
        clientId: clientId || null,
        label: label || null,
      });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function onRemove(id: string) {
    if (!confirm("Remove this Ads account mapping?")) return;
    setError(null);
    try {
      await deleteGoogleAdsConnection(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={onAdd} className="flex flex-wrap gap-3 items-end border rounded-lg p-4">
        <div className="min-w-[160px]">
          <label className="text-sm font-medium">Ads customer ID</label>
          <input
            value={adsId}
            onChange={(e) => setAdsId(e.target.value.replace(/\D/g, ""))}
            placeholder="1852460409"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
            required
          />
        </div>
        <div className="min-w-[180px]">
          <label className="text-sm font-medium">CRM client (optional)</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
          >
            <option value="">— None —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-sm font-medium">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit">Add / update mapping</Button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-4">Ads ID</th>
              <th className="py-2 pr-4">Account name</th>
              <th className="py-2 pr-4">CRM client</th>
              <th className="py-2 pr-4">Label</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-muted-foreground">
                  No mappings yet. Add an Ads customer ID above or load any account from the overview tab.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4 font-mono">{r.googleAdsCustomerId}</td>
                  <td className="py-2 pr-4">{r.displayName ?? "—"}</td>
                  <td className="py-2 pr-4">{r.clientName ?? "—"}</td>
                  <td className="py-2 pr-4">{r.label ?? "—"}</td>
                  <td className="py-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRemove(r.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
