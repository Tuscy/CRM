"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@stky/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { deleteAnalyticsCredential } from "@/lib/server/actions/analytics";
import type { AnalyticsCredentialDto } from "@/lib/server/actions/analytics";

type CredentialType = "GA4" | "SEARCH_CONSOLE";

const TYPE_LABELS: Record<CredentialType, string> = {
  GA4: "Google Analytics 4",
  SEARCH_CONSOLE: "Search Console",
};

const ACCOUNT_ID_LABELS: Record<CredentialType, string> = {
  GA4: "GA4 property ID (e.g. 123456789 or properties/123456789)",
  SEARCH_CONSOLE: "Site URL (e.g. https://example.com/ or sc-domain:example.com)",
};

export function AnalyticsCredentialsForm({
  credentials,
  clients,
}: {
  credentials: AnalyticsCredentialDto[];
  clients: { id: string; name: string }[];
}) {
  const [type, setType] = useState<CredentialType>("GA4");
  const [clientId, setClientId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string) {
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteAnalyticsCredential(id);
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  }

  // Build the OAuth connect URL
  const oauthUrl = `/api/oauth/google?type=${type}&accountId=${encodeURIComponent(accountId)}${
    clientId ? `&clientId=${encodeURIComponent(clientId)}` : ""
  }`;

  const canConnect = accountId.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Existing credentials */}
      {credentials.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Connected credentials</p>
          <div className="divide-y rounded-md border">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {TYPE_LABELS[cred.type]}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {cred.clientName
                        ? `— ${cred.clientName}`
                        : "— Org-level"}
                    </span>
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {cred.accountId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last updated {new Date(cred.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(cred.id)}
                  disabled={isPending}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
        </div>
      )}

      {credentials.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No analytics credentials connected yet.
        </p>
      )}

      {/* Add new credential */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connect a credential</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Service</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CredentialType)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="GA4">Google Analytics 4</option>
                <option value="SEARCH_CONSOLE">Search Console</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Scope</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="">Org-level (default for all clients)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Account ID</label>
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
              placeholder={ACCOUNT_ID_LABELS[type]}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {ACCOUNT_ID_LABELS[type]}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button asChild disabled={!canConnect} size="sm">
              <Link href={canConnect ? oauthUrl : "#"}>
                Connect with Google →
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to Google to grant read-only access.
            </p>
          </div>

          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">How to find your Account ID</p>
            <p>
              <strong>GA4:</strong> Google Analytics → Admin → Property settings →
              Property ID (numbers only, e.g. <code>123456789</code>)
            </p>
            <p>
              <strong>Search Console:</strong> The exact URL shown in Search Console
              — include trailing slash for URL-prefix properties (e.g.{" "}
              <code>https://example.com/</code>) or use{" "}
              <code>sc-domain:example.com</code> for domain properties.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
