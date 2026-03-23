"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { clientLogin } from "@/lib/server/actions/client-auth";
import { Button } from "@stky/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

export default function ClientLoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function action(formData: FormData) {
    const result = await clientLogin(formData);
    if (result && "error" in result) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Client sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="you@company.com"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" aria-live="polite">
                {error}
              </p>
            )}
            <SubmitButton />
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Use the email configured for your portal access. This simple flow
            looks up an existing client user; in a production setup, replace it
            with a full auth provider or magic-link flow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

