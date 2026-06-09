"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@stky/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@stky/ui";
import type {
  RsaAdRow,
  RsaAsset,
  GoogleAdsCampaignRow,
  AdCopyResponse,
  GoogleAdsAuditLogEntry,
  PythonOperationResult,
} from "@/lib/google-ads/types";
import { formatPythonPreview } from "@/lib/google-ads/preview-format";

// ── helpers ──────────────────────────────────────────────────────────────────

function approvalBadgeClass(status: string): string {
  if (status === "APPROVED") return "bg-green-100 text-green-800";
  if (status === "APPROVED_LIMITED") return "bg-amber-100 text-amber-800";
  if (status.includes("DISAPPROVED")) return "bg-red-100 text-red-800";
  return "bg-muted text-muted-foreground";
}

function AssetList({ assets, label }: { assets: RsaAsset[]; label: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <ul className="space-y-0.5">
        {assets.map((a, i) => (
          <li key={i} className="text-sm flex items-baseline gap-2">
            <span>{a.text}</span>
            {a.pinnedField && (
              <span className="text-xs text-muted-foreground font-mono">
                [{a.pinnedField}]
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── inline text-area list editor ─────────────────────────────────────────────

function AssetEditor({
  assets,
  onChange,
  label,
  maxItems,
}: {
  assets: RsaAsset[];
  onChange: (next: RsaAsset[]) => void;
  label: string;
  maxItems: number;
}) {
  function update(i: number, text: string) {
    const next = assets.map((a, j) => (j === i ? { ...a, text } : a));
    onChange(next);
  }
  function remove(i: number) {
    onChange(assets.filter((_, j) => j !== i));
  }
  function add() {
    if (assets.length >= maxItems) return;
    onChange([...assets, { text: "", pinnedField: null }]);
  }

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="space-y-1">
        {assets.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={a.text}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
              placeholder={`${label.slice(0, -1)} text`}
            />
            {a.pinnedField && (
              <span className="text-xs text-muted-foreground self-center font-mono">
                {a.pinnedField}
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-muted-foreground hover:text-destructive"
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {assets.length < maxItems && (
        <button
          type="button"
          onClick={add}
          className="mt-1 text-xs text-primary underline"
        >
          + Add {label.toLowerCase().replace("s", "")}
        </button>
      )}
    </div>
  );
}

// ── diff view ────────────────────────────────────────────────────────────────

function DiffView({
  original,
  edited,
  label,
}: {
  original: RsaAsset[];
  edited: RsaAsset[];
  label: string;
}) {
  const maxLen = Math.max(original.length, edited.length);
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground mb-0.5">Before</p>
          {Array.from({ length: maxLen }).map((_, i) => {
            const a = original[i];
            const b = edited[i];
            const changed = a?.text !== b?.text;
            return (
              <p
                key={i}
                className={`py-0.5 ${changed ? "line-through text-red-600" : ""}`}
              >
                {a?.text ?? <span className="text-muted-foreground italic">—</span>}
              </p>
            );
          })}
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">After</p>
          {Array.from({ length: maxLen }).map((_, i) => {
            const a = original[i];
            const b = edited[i];
            const changed = a?.text !== b?.text;
            return (
              <p
                key={i}
                className={`py-0.5 ${changed ? "text-green-700 font-medium" : ""}`}
              >
                {b?.text ?? <span className="text-muted-foreground italic">—</span>}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type EditPhase =
  | "idle"
  | "editing"
  | "previewing"
  | "preview_ready"
  | "executing"
  | "done"
  | "error";

interface EditState {
  ad: RsaAdRow;
  headlines: RsaAsset[];
  descriptions: RsaAsset[];
  phase: EditPhase;
  previewResult: PythonOperationResult | null;
  executeResult: PythonOperationResult | null;
  error: string | null;
}

export function AdCopyTab({
  customerId,
  campaigns,
}: {
  customerId: string;
  campaigns: GoogleAdsCampaignRow[];
}) {
  const [ads, setAds] = useState<RsaAdRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<GoogleAdsAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [editState, setEditState] = useState<EditState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        customerId,
        ...(campaignFilter ? { campaignId: campaignFilter } : {}),
      });
      const res = await fetch(`/api/google-ads/ad-copy?${q}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load ad copy");
        return;
      }
      const data = json as AdCopyResponse;
      setAds(data.ads);
      setAuditLogs(data.auditLogs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [customerId, campaignFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(ad: RsaAdRow) {
    setEditState({
      ad,
      headlines: ad.headlines.map((h) => ({ ...h })),
      descriptions: ad.descriptions.map((d) => ({ ...d })),
      phase: "editing",
      previewResult: null,
      executeResult: null,
      error: null,
    });
  }

  async function handlePreview() {
    if (!editState) return;
    setEditState((s) => s && { ...s, phase: "previewing", error: null });
    try {
      const res = await fetch("/api/google-ads/rsa/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          adId: editState.ad.adId,
          adGroupId: editState.ad.adGroupId,
          campaignId: editState.ad.campaignId,
          headlines: editState.headlines,
          descriptions: editState.descriptions,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditState((s) =>
          s && {
            ...s,
            phase: "error",
            error: json.error ?? "Preview failed",
          }
        );
        return;
      }
      setEditState((s) =>
        s && {
          ...s,
          phase: "preview_ready",
          previewResult: json.preview as PythonOperationResult,
        }
      );
    } catch (e) {
      setEditState((s) =>
        s && {
          ...s,
          phase: "error",
          error: e instanceof Error ? e.message : "Preview failed",
        }
      );
    }
  }

  async function handleExecute() {
    if (!editState) return;
    setEditState((s) => s && { ...s, phase: "executing", error: null });
    try {
      const res = await fetch("/api/google-ads/rsa/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          adId: editState.ad.adId,
          adGroupId: editState.ad.adGroupId,
          campaignId: editState.ad.campaignId,
          headlines: editState.headlines,
          descriptions: editState.descriptions,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditState((s) =>
          s && {
            ...s,
            phase: "error",
            error: json.error ?? "Execute failed",
          }
        );
        return;
      }
      setEditState((s) =>
        s && {
          ...s,
          phase: "done",
          executeResult: json.result as PythonOperationResult,
        }
      );
      // Refresh audit logs
      void load();
    } catch (e) {
      setEditState((s) =>
        s && {
          ...s,
          phase: "error",
          error: e instanceof Error ? e.message : "Execute failed",
        }
      );
    }
  }

  // Audit logs relevant to an ad (by adId in the payload JSON)
  function logsForAd(adId: string): GoogleAdsAuditLogEntry[] {
    return auditLogs.filter((l) => {
      try {
        const p = l as unknown as { payload?: { adId?: string } };
        return p.payload?.adId === adId;
      } catch {
        return false;
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px]">
          <label className="text-sm font-medium">Filter by campaign</label>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
          >
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading ad copy…</p>}

      {!loading && ads.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          No responsive search ads found for this account / campaign.
        </p>
      )}

      <div className="space-y-4">
        {ads.map((ad) => {
          const adLogs = logsForAd(ad.adId);
          return (
            <Card key={ad.adId}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{ad.campaign}</CardTitle>
                    <p className="text-sm text-muted-foreground">{ad.adGroup}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${approvalBadgeClass(
                        ad.approvalStatus
                      )}`}
                    >
                      {ad.approvalStatus.replace(/_/g, " ")}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(ad)}
                    >
                      Edit Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AssetList assets={ad.headlines} label="Headlines" />
                  <AssetList assets={ad.descriptions} label="Descriptions" />
                </div>

                {adLogs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Recent edits
                    </p>
                    <ul className="space-y-1">
                      {adLogs.map((l) => (
                        <li
                          key={l.id}
                          className="text-xs text-muted-foreground flex gap-2"
                        >
                          <span className="font-mono">
                            {new Date(l.createdAt).toLocaleString()}
                          </span>
                          <span>{l.execute ? "applied" : "preview"}</span>
                          {l.actorUserId && <span>by {l.actorUserId}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit / Preview / Execute modal */}
      <Dialog
        open={editState !== null}
        onOpenChange={(open) => { if (!open) setEditState(null); }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ad Copy</DialogTitle>
            {editState && (
              <DialogDescription>
                {editState.ad.campaign} · {editState.ad.adGroup}
              </DialogDescription>
            )}
          </DialogHeader>

          {editState?.phase === "editing" && (
            <>
              <div className="space-y-4">
                <AssetEditor
                  assets={editState.headlines}
                  onChange={(h) =>
                    setEditState((s) => s && { ...s, headlines: h })
                  }
                  label="Headlines"
                  maxItems={15}
                />
                <AssetEditor
                  assets={editState.descriptions}
                  onChange={(d) =>
                    setEditState((s) => s && { ...s, descriptions: d })
                  }
                  label="Descriptions"
                  maxItems={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditState(null)}>
                  Cancel
                </Button>
                <Button onClick={() => void handlePreview()}>
                  Preview changes
                </Button>
              </DialogFooter>
            </>
          )}

          {editState?.phase === "previewing" && (
            <p className="text-sm text-muted-foreground">Running preview…</p>
          )}

          {editState?.phase === "preview_ready" && (
            <>
              <div className="space-y-4">
                <DiffView
                  original={editState.ad.headlines}
                  edited={editState.headlines}
                  label="Headlines diff"
                />
                <DiffView
                  original={editState.ad.descriptions}
                  edited={editState.descriptions}
                  label="Descriptions diff"
                />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Dry-run summary
                  </p>
                  <ul className="rounded bg-muted p-3 text-sm space-y-1 list-disc pl-5">
                    {editState.previewResult
                      ? formatPythonPreview(editState.previewResult).map(
                          (line, i) => <li key={i}>{line}</li>
                        )
                      : null}
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    setEditState((s) => s && { ...s, phase: "editing" })
                  }
                >
                  Back to edit
                </Button>
                <Button onClick={() => void handleExecute()}>
                  Confirm — apply changes
                </Button>
              </DialogFooter>
            </>
          )}

          {editState?.phase === "executing" && (
            <p className="text-sm text-muted-foreground">Applying changes…</p>
          )}

          {editState?.phase === "done" && (
            <>
              <p
                className={`text-sm ${
                  editState.executeResult?.success
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                {editState.executeResult?.success
                  ? "Ad copy updated successfully."
                  : "Failed to update ad copy."}
              </p>
              {editState.executeResult?.resource_names?.length ? (
                <p className="text-xs text-muted-foreground font-mono">
                  {editState.executeResult.resource_names.join(", ")}
                </p>
              ) : null}
              <DialogFooter>
                <Button onClick={() => setEditState(null)}>Close</Button>
              </DialogFooter>
            </>
          )}

          {editState?.phase === "error" && (
            <>
              <p className="text-sm text-destructive">{editState.error}</p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    setEditState((s) => s && { ...s, phase: "editing", error: null })
                  }
                >
                  Back to edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
