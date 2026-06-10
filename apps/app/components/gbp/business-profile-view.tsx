"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReviewsTab } from "./reviews-tab";
import { PostsTab } from "./posts-tab";
import { InsightsTab } from "./insights-tab";

const TABS = [
  { id: "reviews", label: "Reviews" },
  { id: "posts", label: "Posts" },
  { id: "insights", label: "Insights" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function NotConfigured({ clientName }: { clientName: string | null }) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-medium">
        Google Business Profile not connected
        {clientName ? ` for ${clientName}` : ""}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Connect a GBP location credential to load reviews, posts, and insights.
      </p>
      <Link
        href="/dashboard/settings/analytics"
        className="inline-block mt-3 text-sm underline hover:text-foreground"
      >
        Connect in Analytics settings →
      </Link>
    </div>
  );
}

export function BusinessProfileView({
  clients,
  initialClientId,
}: {
  clients: { id: string; name: string }[];
  initialClientId: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("reviews");
  const clientId = initialClientId;
  const clientName = clients.find((c) => c.id === clientId)?.name ?? null;

  function handleClientChange(next: string) {
    router.push(
      next
        ? `/dashboard/business-profile?clientId=${encodeURIComponent(next)}`
        : "/dashboard/business-profile"
    );
  }

  return (
    <div className="space-y-6">
      {/* Client switcher */}
      <div className="max-w-xs">
        <label className="text-sm font-medium">Client</label>
        <select
          value={clientId}
          onChange={(e) => handleClientChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Org-level (agency location)</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Lazy-mounted tab content — keyed by clientId so switching client refetches */}
      {activeTab === "reviews" && (
        <ReviewsTab key={`reviews-${clientId}`} clientId={clientId} clientName={clientName} />
      )}
      {activeTab === "posts" && (
        <PostsTab key={`posts-${clientId}`} clientId={clientId} clientName={clientName} />
      )}
      {activeTab === "insights" && (
        <InsightsTab key={`insights-${clientId}`} clientId={clientId} clientName={clientName} />
      )}
    </div>
  );
}
