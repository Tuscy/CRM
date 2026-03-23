"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateLead } from "@/lib/server/actions/leads";
import type { Lead } from "@prisma/client";

export function UpdateLeadForm({ lead }: { lead: Lead }) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await updateLead(lead.id, {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        company: (formData.get("company") as string) || undefined,
        website: (formData.get("website") as string) || undefined,
        source: (formData.get("source") as string) || undefined,
        status: (formData.get("status") as string) || undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              name="name"
              defaultValue={lead.name}
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={lead.email}
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Company</label>
            <input
              name="company"
              defaultValue={lead.company ?? ""}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Website</label>
            <input
              name="website"
              type="url"
              defaultValue={lead.website ?? ""}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Source</label>
            <input
              name="source"
              defaultValue={lead.source ?? ""}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <input
              name="status"
              defaultValue={lead.status}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
