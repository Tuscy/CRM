"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@stky/ui";
import { deleteEmailTemplate } from "@/lib/email-flows/templates";

export function DeleteTemplateButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Delete template "${name}"? This cannot be undone. Templates used by active flows cannot be deleted.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteEmailTemplate(id);
        toast.success("Template deleted");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete template");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
