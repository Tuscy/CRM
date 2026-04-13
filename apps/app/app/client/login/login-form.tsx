"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestClientMagicLink,
  type PortalMagicLinkResult,
} from "@/lib/server/actions/client-auth";
import { Button } from "@stky/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending link…" : "Email sign-in link"}
    </Button>
  );
}

export function ClientLoginForm({
  verifyError,
}: {
  verifyError: string | null;
}) {
  const [result, setResult] = useState<PortalMagicLinkResult | null>(null);

  async function action(formData: FormData) {
    const out = await requestClientMagicLink(formData);
    setResult(out);
  }

  const success = result && "ok" in result && result.ok ? true : false;
  const errorMsg = result && "error" in result ? result.error : null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Client sign in</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If an account exists for that email, we&apos;ve sent a sign-in link.
                It expires in 15 minutes.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResult(null)}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="you@company.com"
                />
              </div>
              {(errorMsg || verifyError) && (
                <p className="text-sm text-destructive" aria-live="polite">
                  {verifyError ?? errorMsg}
                </p>
              )}
              <SubmitButton />
            </form>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Passwordless sign-in via email link. Contact your account manager if
            you lose access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
