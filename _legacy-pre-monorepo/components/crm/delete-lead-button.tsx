"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteLead } from "@/lib/server/actions/leads";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this lead?")) return;
    setPending(true);
    try {
      await deleteLead(leadId);
      router.push("/dashboard/leads");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? "Deleting…" : "Delete lead"}
    </Button>
  );
}
