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
import { formatMoney, formatCtr } from "@/lib/google-ads/format";
import { formatPythonPreview } from "@/lib/google-ads/preview-format";
import type {
  KeywordPerformanceRow,
  GoogleAdsCampaignRow,
  NegativeKeywordInput,
  PythonOperationResult,
} from "@/lib/google-ads/types";

function qsClass(qs: number | null): string {
  if (qs == null) return "text-muted-foreground";
  if (qs >= 7) return "text-green-600 font-semibold";
  if (qs >= 4) return "text-amber-600 font-semibold";
  return "text-red-600 font-semibold";
}

type ConfirmState =
  | { phase: "idle" }
  | { phase: "confirming"; keyword: KeywordPerformanceRow }
  | { phase: "previewing"; keyword: KeywordPerformanceRow; loading: true }
  | {
      phase: "preview_ready";
      keyword: KeywordPerformanceRow;
      preview: PythonOperationResult;
    }
  | { phase: "executing"; keyword: KeywordPerformanceRow }
  | { phase: "done"; keyword: KeywordPerformanceRow; result: PythonOperationResult }
  | { phase: "error"; message: string };

export function KeywordsTab({
  customerId,
  days,
  campaigns,
  currency,
}: {
  customerId: string;
  days: number;
  campaigns: GoogleAdsCampaignRow[];
  currency: string;
}) {
  const [keywords, setKeywords] = useState<KeywordPerformanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>({ phase: "idle" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        customerId,
        days: String(days),
        ...(campaignFilter ? { campaignId: campaignFilter } : {}),
      });
      const res = await fetch(`/api/google-ads/keyword-performance?${q}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load keyword performance");
        return;
      }
      setKeywords(json.keywords as KeywordPerformanceRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [customerId, days, campaignFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePreview(kw: KeywordPerformanceRow) {
    setConfirm({ phase: "previewing", keyword: kw, loading: true });
    try {
      const res = await fetch("/api/google-ads/negatives/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          keywords: [
            {
              text: kw.text,
              matchType: kw.matchType,
              campaignId: kw.campaignId,
              adGroupId: kw.adGroupId,
            } satisfies NegativeKeywordInput,
          ],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setConfirm({ phase: "error", message: json.error ?? "Preview failed" });
        return;
      }
      setConfirm({
        phase: "preview_ready",
        keyword: kw,
        preview: json.preview as PythonOperationResult,
      });
    } catch (e) {
      setConfirm({
        phase: "error",
        message: e instanceof Error ? e.message : "Preview failed",
      });
    }
  }

  async function handleExecute(kw: KeywordPerformanceRow) {
    setConfirm({ phase: "executing", keyword: kw });
    try {
      const res = await fetch("/api/google-ads/negatives/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          keywords: [
            {
              text: kw.text,
              matchType: kw.matchType,
              campaignId: kw.campaignId,
              adGroupId: kw.adGroupId,
            } satisfies NegativeKeywordInput,
          ],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setConfirm({ phase: "error", message: json.error ?? "Execute failed" });
        return;
      }
      setConfirm({
        phase: "done",
        keyword: kw,
        result: json.result as PythonOperationResult,
      });
    } catch (e) {
      setConfirm({
        phase: "error",
        message: e instanceof Error ? e.message : "Execute failed",
      });
    }
  }

  const dialogOpen =
    confirm.phase !== "idle";

  return (
    <div className="space-y-4">
      {/* Campaign filter */}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Keyword Performance ({keywords.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Keyword</th>
                <th className="py-2 pr-3">Match</th>
                <th className="py-2 pr-3">QS</th>
                <th className="py-2 pr-3">Impr.</th>
                <th className="py-2 pr-3">Clicks</th>
                <th className="py-2 pr-3">CTR</th>
                <th className="py-2 pr-3">Avg CPC</th>
                <th className="py-2 pr-3">Conv.</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-4 text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : keywords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-4 text-muted-foreground">
                    No keyword data for this period.
                  </td>
                </tr>
              ) : (
                keywords.map((k, i) => (
                  <tr key={`${k.criterionId}-${i}`} className="border-b">
                    <td className="py-2 pr-3 font-medium">{k.text}</td>
                    <td className="py-2 pr-3 text-xs">{k.matchType}</td>
                    <td className={`py-2 pr-3 ${qsClass(k.qualityScore)}`}>
                      {k.qualityScore ?? "—"}
                    </td>
                    <td className="py-2 pr-3">{k.impressions.toLocaleString()}</td>
                    <td className="py-2 pr-3">{k.clicks.toLocaleString()}</td>
                    <td className="py-2 pr-3">{formatCtr(k.ctr)}</td>
                    <td className="py-2 pr-3">
                      {formatMoney(k.averageCpc, currency)}
                    </td>
                    <td className="py-2 pr-3">{k.conversions.toLocaleString()}</td>
                    <td className="py-2 pr-3 text-xs">{k.status}</td>
                    <td className="py-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setConfirm({ phase: "confirming", keyword: k })
                        }
                      >
                        Add negative
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Confirm → Preview → Execute modal */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setConfirm({ phase: "idle" });
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add as negative keyword</DialogTitle>
          </DialogHeader>

          {confirm.phase === "confirming" && (
            <>
              <p className="text-sm">
                Add{" "}
                <strong>
                  {confirm.keyword.text} ({confirm.keyword.matchType})
                </strong>{" "}
                as a negative keyword to campaign{" "}
                <strong>{confirm.keyword.campaign}</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                A dry-run preview will be shown before any changes are applied.
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirm({ phase: "idle" })}
                >
                  Cancel
                </Button>
                <Button onClick={() => void handlePreview(confirm.keyword)}>
                  Preview changes
                </Button>
              </DialogFooter>
            </>
          )}

          {confirm.phase === "previewing" && (
            <p className="text-sm text-muted-foreground">Running preview…</p>
          )}

          {confirm.phase === "preview_ready" && (
            <>
              <p className="text-sm font-medium">Dry-run result</p>
              <ul className="rounded bg-muted p-3 text-sm space-y-1 list-disc pl-5">
                {formatPythonPreview(confirm.preview).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirm({ phase: "idle" })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleExecute(confirm.keyword)}
                >
                  Confirm — apply changes
                </Button>
              </DialogFooter>
            </>
          )}

          {confirm.phase === "executing" && (
            <p className="text-sm text-muted-foreground">Applying changes…</p>
          )}

          {confirm.phase === "done" && (
            <>
              <p className={`text-sm ${confirm.result.success ? "text-green-600" : "text-destructive"}`}>
                {confirm.result.success
                  ? "Negative keyword added successfully."
                  : "Failed to add negative keyword."}
              </p>
              {confirm.result.resource_names?.length ? (
                <p className="text-xs text-muted-foreground font-mono">
                  {confirm.result.resource_names.join(", ")}
                </p>
              ) : null}
              <DialogFooter>
                <Button onClick={() => setConfirm({ phase: "idle" })}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}

          {confirm.phase === "error" && (
            <>
              <p className="text-sm text-destructive">{confirm.message}</p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirm({ phase: "idle" })}
                >
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
