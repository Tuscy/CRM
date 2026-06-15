"use client";

import { useState } from "react";
import { Button } from "@stky/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { resolveLeadSourceFromForm } from "@stky/crm";
import { updateLead } from "@/lib/server/actions/leads";
import { LeadSourceFields } from "@/components/crm/lead-source-fields";
import type { Lead } from "@stky/db";

const inputClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function UpdateLeadForm({ lead }: { lead: Lead }) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await updateLead(lead.id, {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: ((formData.get("phone") as string) ?? "").trim() || null,
        company: (formData.get("company") as string) || undefined,
        website: (formData.get("website") as string) || undefined,
        source: resolveLeadSourceFromForm(
          (formData.get("sourceSelect") as string) ?? "",
          (formData.get("sourceCustom") as string) ?? ""
        ),
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
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={lead.email}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={lead.phone ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Company</label>
            <input
              name="company"
              defaultValue={lead.company ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Website</label>
            <input
              name="website"
              type="url"
              defaultValue={lead.website ?? ""}
              className={inputClass}
            />
          </div>
          <LeadSourceFields defaultSource={lead.source} idPrefix="edit-" />
          <div>
            <label className="text-sm font-medium">Status</label>
            <input
              name="status"
              defaultValue={lead.status}
              className={inputClass}
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
