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
} from "@stky/ui";
import { formatCtr } from "@/lib/google-ads/format";
import { formatPythonPreview } from "@/lib/google-ads/preview-format";
import type {
  SearchTermRow,
  GoogleAdsCampaignRow,
  NegativeKeywordInput,
  PythonOperationResult,
} from "@/lib/google-ads/types";

type BulkPhase =
  | "idle"
  | "confirming"
  | "previewing"
  | "preview_ready"
  | "executing"
  | "done"
  | "error";

export function SearchTermsTab({
  customerId,
  days,
  campaigns,
}: {
  customerId: string;
  days: number;
  campaigns: GoogleAdsCampaignRow[];
}) {
  const [terms, setTerms] = useState<SearchTermRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Bulk negative modal state
  const [bulkPhase, setBulkPhase] = useState<BulkPhase>("idle");
  const [bulkPreview, setBulkPreview] = useState<PythonOperationResult | null>(null);
  const [bulkResult, setBulkResult] = useState<PythonOperationResult | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const q = new URLSearchParams({
        customerId,
        days: String(days),
        ...(campaignFilter ? { campaignId: campaignFilter } : {}),
      });
      const res = await fetch(`/api/google-ads/search-terms?${q}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load search terms");
        return;
      }
      setTerms(json.searchTerms as SearchTermRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [customerId, days, campaignFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleSelect(term: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === terms.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(terms.map((t) => t.searchTerm)));
    }
  }

  function selectedTerms(): SearchTermRow[] {
    return terms.filter((t) => selected.has(t.searchTerm));
  }

  function toNegativeInputs(rows: SearchTermRow[]): NegativeKeywordInput[] {
    // Use EXACT match for search terms added as negatives
    return rows.map((t) => ({
      text: t.searchTerm,
      matchType: "EXACT",
      campaignId: t.campaignId,
    }));
  }

  async function handleBulkPreview() {
    setBulkPhase("previewing");
    setBulkError(null);
    try {
      const res = await fetch("/api/google-ads/negatives/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          keywords: toNegativeInputs(selectedTerms()),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBulkError(json.error ?? "Preview failed");
        setBulkPhase("error");
        return;
      }
      setBulkPreview(json.preview as PythonOperationResult);
      setBulkPhase("preview_ready");
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Preview failed");
      setBulkPhase("error");
    }
  }

  async function handleBulkExecute() {
    setBulkPhase("executing");
    try {
      const res = await fetch("/api/google-ads/negatives/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          keywords: toNegativeInputs(selectedTerms()),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBulkError(json.error ?? "Execute failed");
        setBulkPhase("error");
        return;
      }
      setBulkResult(json.result as PythonOperationResult);
      setBulkPhase("done");
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Execute failed");
      setBulkPhase("error");
    }
  }

  function closeModal() {
    setBulkPhase("idle");
    setBulkPreview(null);
    setBulkResult(null);
    setBulkError(null);
  }

  return (
    <div className="space-y-4">
      {/* Filters + bulk action */}
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
        {selected.size > 0 && (
          <Button
            type="button"
            size="sm"
            onClick={() => setBulkPhase("confirming")}
          >
            Add {selected.size} as negatives
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Search Terms ({terms.length})
            {selected.size > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {selected.size} selected
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={terms.length > 0 && selected.size === terms.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="py-2 pr-3">Search term</th>
                <th className="py-2 pr-3">Matched keyword</th>
                <th className="py-2 pr-3">Campaign</th>
                <th className="py-2 pr-3">Ad group</th>
                <th className="py-2 pr-3">Impr.</th>
                <th className="py-2 pr-3">Clicks</th>
                <th className="py-2 pr-3">CTR</th>
                <th className="py-2 pr-3">Conv.</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-4 text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : terms.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-4 text-muted-foreground">
                    No search term data for this period.
                  </td>
                </tr>
              ) : (
                terms.map((t, i) => (
                  <tr
                    key={`${t.searchTerm}-${i}`}
                    className={`border-b ${
                      selected.has(t.searchTerm) ? "bg-muted/50" : ""
                    }`}
                  >
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${t.searchTerm}`}
                        checked={selected.has(t.searchTerm)}
                        onChange={() => toggleSelect(t.searchTerm)}
                      />
                    </td>
                    <td className="py-2 pr-3 font-medium">{t.searchTerm}</td>
                    <td className="py-2 pr-3 text-xs">{t.matchedKeyword ?? "—"}</td>
                    <td className="py-2 pr-3 text-xs">{t.campaign}</td>
                    <td className="py-2 pr-3 text-xs">{t.adGroup}</td>
                    <td className="py-2 pr-3">{t.impressions.toLocaleString()}</td>
                    <td className="py-2 pr-3">{t.clicks.toLocaleString()}</td>
                    <td className="py-2 pr-3">{formatCtr(t.ctr)}</td>
                    <td className="py-2 pr-3">{t.conversions.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-xs">{t.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Bulk negative modal */}
      <Dialog
        open={bulkPhase !== "idle"}
        onOpenChange={(open) => { if (!open) closeModal(); }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add selected as negative keywords</DialogTitle>
          </DialogHeader>

          {bulkPhase === "confirming" && (
            <>
              <p className="text-sm">
                Add the following {selected.size} search term
                {selected.size !== 1 ? "s" : ""} as exact-match negatives?
              </p>
              <ul className="rounded bg-muted p-3 text-xs space-y-1 max-h-48 overflow-auto">
                {selectedTerms().map((t) => (
                  <li key={t.searchTerm}>
                    <strong>{t.searchTerm}</strong> → {t.campaign}
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={() => void handleBulkPreview()}>
                  Preview changes
                </Button>
              </DialogFooter>
            </>
          )}

          {bulkPhase === "previewing" && (
            <p className="text-sm text-muted-foreground">Running preview…</p>
          )}

          {bulkPhase === "preview_ready" && (
            <>
              <p className="text-sm font-medium">Dry-run result</p>
              <ul className="rounded bg-muted p-3 text-sm space-y-1 list-disc pl-5 max-h-48 overflow-auto">
                {bulkPreview
                  ? formatPythonPreview(bulkPreview).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))
                  : null}
              </ul>
              <DialogFooter>
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={() => void handleBulkExecute()}>
                  Confirm — apply changes
                </Button>
              </DialogFooter>
            </>
          )}

          {bulkPhase === "executing" && (
            <p className="text-sm text-muted-foreground">Applying changes…</p>
          )}

          {bulkPhase === "done" && (
            <>
              <p className={`text-sm ${bulkResult?.success ? "text-green-600" : "text-destructive"}`}>
                {bulkResult?.success
                  ? "Negative keywords added successfully."
                  : "Some or all negative keywords failed."}
              </p>
              {bulkResult?.resource_names?.length ? (
                <p className="text-xs text-muted-foreground font-mono">
                  {bulkResult.resource_names.join(", ")}
                </p>
              ) : null}
              <DialogFooter>
                <Button onClick={closeModal}>Close</Button>
              </DialogFooter>
            </>
          )}

          {bulkPhase === "error" && (
            <>
              <p className="text-sm text-destructive">{bulkError}</p>
              <DialogFooter>
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
