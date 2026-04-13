"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@stky/ui";

export function StaffCredentialsForm({
  callbackUrl,
}: {
  callbackUrl: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setPending(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    if (result?.url) {
      window.location.href = result.url;
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="staff-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="staff-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="staff-password"
          className="mb-1 block text-sm font-medium"
        >
          Password
        </label>
        <input
          id="staff-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
