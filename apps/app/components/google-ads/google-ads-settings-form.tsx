"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  saveGoogleAdsSettings,
  syncConnectionDisplayNames,
} from "@/lib/server/actions/google-ads";
import { Button } from "@stky/ui";
import type { GoogleAdsEnvStatus } from "@/lib/google-ads/types";

function SaveMccButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save MCC ID"}
    </Button>
  );
}

export function GoogleAdsSettingsForm({
  initialLoginCustomerId,
  env,
}: {
  initialLoginCustomerId: string;
  env: GoogleAdsEnvStatus;
}) {
  const [loginCustomerId, setLoginCustomerId] = useState(
    initialLoginCustomerId
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function onSaveMcc(formData: FormData) {
    setError(null);
    setMessage(null);
    try {
      const id = (formData.get("loginCustomerId") as string)?.trim();
      await saveGoogleAdsSettings(id);
      setLoginCustomerId(id.replace(/\D/g, ""));
      setMessage("Manager account ID saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function onTestConnection() {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const res = await fetch("/api/google-ads/accessible-customers");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Connection test failed");
        return;
      }
      const count = data.customers?.length ?? 0;
      setTestResult(`Connected — ${count} accessible account(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  async function onSyncNames() {
    setError(null);
    setMessage(null);
    try {
      await syncConnectionDisplayNames();
      setMessage("Account names refreshed from Google Ads.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {testResult && (
        <p className="text-sm text-muted-foreground">{testResult}</p>
      )}

      <div className="text-sm space-y-1">
        <p>
          <span className="font-medium">Server credentials:</span>{" "}
          {env.ready ? (
            <span className="text-green-700 dark:text-green-400">Configured</span>
          ) : (
            <span className="text-destructive">Missing env vars</span>
          )}
        </p>
        <ul className="text-muted-foreground list-disc list-inside text-xs">
          <li>Developer token: {env.developerToken ? "yes" : "no"}</li>
          <li>OAuth client: {env.clientId && env.clientSecret ? "yes" : "no"}</li>
          <li>Refresh token: {env.refreshToken ? "yes" : "no"}</li>
        </ul>
      </div>

      <form action={onSaveMcc} className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="loginCustomerId" className="text-sm font-medium">
            Manager (MCC) customer ID
          </label>
          <input
            id="loginCustomerId"
            name="loginCustomerId"
            defaultValue={loginCustomerId}
            placeholder="10 digits, no dashes"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
          />
        </div>
        <SaveMccButton />
        <Button type="button" variant="outline" onClick={onTestConnection} disabled={testing || !env.ready}>
          {testing ? "Testing…" : "Test connection"}
        </Button>
        <Button type="button" variant="outline" onClick={onSyncNames} disabled={!env.ready}>
          Sync account names
        </Button>
      </form>
    </div>
  );
}
