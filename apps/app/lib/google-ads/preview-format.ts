import type { PythonOperationResult } from "./types";

type PreviewItem = {
  campaign_id?: string;
  ad_group_id?: string;
  keyword?: string;
  match_type?: string;
  level?: string;
  ad_id?: string;
  headlines?: unknown;
  descriptions?: unknown;
};

function formatPreviewItem(item: PreviewItem): string {
  if (item.keyword) {
    const level = item.level === "ad_group" ? "ad group" : "campaign";
    const target =
      item.level === "ad_group"
        ? `ad group ${item.ad_group_id ?? ""}`
        : `campaign ${item.campaign_id ?? ""}`;
    return `Add negative "${item.keyword}" (${item.match_type ?? "BROAD"}) at ${level} level — ${target}`;
  }
  if (item.ad_id) {
    const h = Array.isArray(item.headlines) ? item.headlines.length : 0;
    const d = Array.isArray(item.descriptions) ? item.descriptions.length : 0;
    return `Update RSA ad ${item.ad_id}: ${h} headline(s), ${d} description(s)`;
  }
  return JSON.stringify(item, null, 2);
}

/** Human-readable lines for dry-run preview modals. */
export function formatPythonPreview(result: PythonOperationResult): string[] {
  const lines: string[] = [];

  if (result.errors?.length) {
    lines.push(...result.errors.map((e) => `Error: ${e}`));
  }

  const preview = result.dry_run_preview;
  if (preview == null) {
    if (result.success) {
      lines.push("Dry run completed — no changes would be applied.");
    }
    return lines;
  }

  if (Array.isArray(preview)) {
    for (const item of preview) {
      if (item && typeof item === "object") {
        lines.push(formatPreviewItem(item as PreviewItem));
      }
    }
  } else if (typeof preview === "object") {
    lines.push(formatPreviewItem(preview as PreviewItem));
  } else {
    lines.push(String(preview));
  }

  if (lines.length === 0 && result.success) {
    lines.push("Dry run completed — no changes would be applied.");
  }

  return lines;
}
